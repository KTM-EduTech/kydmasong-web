import { requireAdmin } from "@/lib/auth";
import type { Redirect } from "@/lib/types";
import { RedirectsEditor } from "./RedirectsEditor";

export const metadata = { title: "Redirects" };

export default async function RedirectsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("redirects").select("*").order("source");
  return <RedirectsEditor items={(data ?? []) as Redirect[]} />;
}
