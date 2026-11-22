import "server-only";
import { redirect } from "next/navigation";
import { sessionClient } from "./supabase/clients";

export type AdminContext = {
  supabase: Awaited<ReturnType<typeof sessionClient>>;
  userId: string;
  email: string;
};

/** Returns the admin context, or null when not signed in or not an admin. */
export async function getAdmin(): Promise<AdminContext | null> {
  const supabase = await sessionClient();
  // getUser() validates the token with Supabase Auth (never trust getSession() alone on the server).
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return null;
  // If two-factor is enabled on the account, require the second factor for this session.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") return null;
  return { supabase, userId: user.id, email: user.email ?? "" };
}

/** For admin pages: redirect to login when not an admin. */
export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdmin();
  if (!ctx) redirect("/admin/login");
  return ctx;
}

/** For server actions: throw when not an admin (the database RLS would refuse anyway). */
export async function assertAdmin(): Promise<AdminContext> {
  const ctx = await getAdmin();
  if (!ctx) throw new Error("Not authorised");
  return ctx;
}
