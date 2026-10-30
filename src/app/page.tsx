import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const signedIn = cookieStore.has("detectgrowth_session") || cookieStore.has("detectgrowth_guest");
  redirect(signedIn ? "/dashboard" : "/auth");
}
