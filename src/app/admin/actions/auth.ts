"use server";
import { redirect } from "next/navigation";
import { draftMode } from "next/headers";
import { sessionClient } from "@/lib/supabase/clients";

export async function signOut() {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  (await draftMode()).disable();
  redirect("/admin/login");
}
