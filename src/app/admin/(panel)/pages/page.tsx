import { requireAdmin } from "@/lib/auth";
import { PagesList } from "./PagesList";

export const metadata = { title: "Pages" };

export default async function PagesIndex({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("pages")
    .select("id, title, slug, status, needs_review, updated_at, sort_order")
    .order("sort_order")
    .order("title");
  return <PagesList pages={data ?? []} openNew={(await searchParams).new === "1"} />;
}
