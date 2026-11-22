import { requireAdmin } from "@/lib/auth";
import type { NavItem } from "@/lib/types";
import { NavEditor } from "./NavEditor";

export const metadata = { title: "Navigation" };

export default async function NavigationPage() {
  const { supabase } = await requireAdmin();
  const [{ data: items }, { data: pages }] = await Promise.all([
    supabase.from("nav_items").select("*").order("position"),
    supabase.from("pages").select("id, title, slug, status").order("title"),
  ]);
  return <NavEditor items={(items ?? []) as NavItem[]} pages={pages ?? []} />;
}
