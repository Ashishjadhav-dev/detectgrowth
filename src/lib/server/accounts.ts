import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

type User = { id: string; name: string; email: string; workspace: string; isDemo: boolean };
type Account = User & { hash: string; salt: string; recoveryHash?: string };
type Session = { user: User; expires: number };
type Database = { accounts: Account[]; sessions: Record<string, Session>; workspaces?: Record<string, Record<string, unknown>> };

const directory = process.env.AUTH_DATA_DIR ?? path.join(process.cwd(), ".data");
const databaseUrl = process.env.DATABASE_URL ?? "";
const sql = databaseUrl ? neon(databaseUrl) : null;
const shared = globalThis as typeof globalThis & { workspaceWriteQueue?: Promise<unknown>; memoryDatabase?: Database; persistenceDisabled?: boolean; neonStateReady?: Promise<void> };
const emptyDatabase = (): Database => ({ accounts: [], sessions: {}, workspaces: {} });

async function ensureNeonState() {
  if (!sql) return;
  if (!shared.neonStateReady) {
    shared.neonStateReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS next_app_state (id TEXT PRIMARY KEY, state JSONB NOT NULL DEFAULT '{"accounts":[],"sessions":{},"workspaces":{}}'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
      await sql`INSERT INTO next_app_state (id) VALUES ('default') ON CONFLICT (id) DO NOTHING`;
    })();
  }
  await shared.neonStateReady;
}

async function readNeonState(): Promise<Database> {
  await ensureNeonState();
  const rows = await sql!`SELECT state FROM next_app_state WHERE id = 'default'` as Array<{ state: Database }>;
  return rows[0]?.state ?? emptyDatabase();
}

async function writeNeonState(db: Database) {
  await sql!`INSERT INTO next_app_state (id, state, updated_at) VALUES ('default', ${JSON.stringify(db)}::jsonb, now()) ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`;
}

async function readLocalState(): Promise<Database> {
  if (shared.persistenceDisabled && shared.memoryDatabase) return shared.memoryDatabase;
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    return JSON.parse(await readFile(path.join(directory, "accounts.json"), "utf8")) as Database;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT" && !shared.persistenceDisabled) shared.persistenceDisabled = true;
    return shared.memoryDatabase ?? emptyDatabase();
  }
}

async function writeLocalState(db: Database) {
  shared.memoryDatabase = db;
  if (shared.persistenceDisabled) return;
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(path.join(directory, "accounts.tmp"), JSON.stringify(db), { mode: 0o600 });
    await rename(path.join(directory, "accounts.tmp"), path.join(directory, "accounts.json"));
  } catch {
    shared.persistenceDisabled = true;
  }
}

export async function transact<T>(operation: (db: Database) => T | Promise<T>): Promise<T> {
  const result = (shared.workspaceWriteQueue ?? Promise.resolve()).then(async () => {
    const db = sql ? await readNeonState() : await readLocalState();
    for (const [key, session] of Object.entries(db.sessions)) if (session.expires <= Date.now()) delete db.sessions[key];
    const value = await operation(db);
    if (sql) await writeNeonState(db);
    else await writeLocalState(db);
    return value;
  });
  shared.workspaceWriteQueue = result.catch(() => {});
  return result;
}

export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export function credentials(password: string, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(password, salt, 64).toString("hex") };
}
export function verify(password: string, account: Account) {
  return timingSafeEqual(Buffer.from(credentials(password, account.salt).hash, "hex"), Buffer.from(account.hash, "hex"));
}
export function publicUser(account: Account): User {
  const { hash: _hash, salt: _salt, recoveryHash: _recoveryHash, ...user } = account;
  return user;
}
export function newSession(db: Database, user: User) {
  const token = randomBytes(32).toString("hex");
  db.sessions[tokenHash(token)] = { user, expires: Date.now() + 7 * 86400000 };
  return token;
}
