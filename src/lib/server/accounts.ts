import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

// Local server adapter. Set AUTH_DATA_DIR to persistent storage when deploying.
const directory = process.env.AUTH_DATA_DIR ?? path.join(process.cwd(), ".data");
type User = { id: string; name: string; email: string; workspace: string; isDemo: boolean };
type Account = User & { hash: string; salt: string };
type Session = { user: User; expires: number };
type Database = { accounts: Account[]; sessions: Record<string, Session>; workspaces?: Record<string, Record<string, unknown>> };
let queue: Promise<unknown> = Promise.resolve();
export function transact<T>(operation: (db: Database) => T | Promise<T>): Promise<T> {
  const result = queue.then(async () => {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    let db: Database;
    try { db = JSON.parse(await readFile(path.join(directory, "accounts.json"), "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; db = { accounts: [], sessions: {} }; }
    for (const [key, session] of Object.entries(db.sessions)) if (session.expires <= Date.now()) delete db.sessions[key];
    const value = await operation(db);
    await writeFile(path.join(directory, "accounts.tmp"), JSON.stringify(db), { mode: 0o600 });
    await rename(path.join(directory, "accounts.tmp"), path.join(directory, "accounts.json"));
    return value;
  });
  queue = result.catch(() => {});
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
  const { hash: _hash, salt: _salt, ...user } = account;
  return user;
}
export function newSession(db: Database, user: User) {
  const token = randomBytes(32).toString("hex");
  db.sessions[tokenHash(token)] = { user, expires: Date.now() + 7 * 86400000 };
  return token;
}
