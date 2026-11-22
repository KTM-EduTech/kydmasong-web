import { requireAdmin } from "@/lib/auth";
import type { Category, Tag } from "@/lib/types";
import { TaxonomyEditor } from "./TaxonomyEditor";

export const metadata = { title: "Categories & tags" };

export default async function TaxonomiesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("tags").select("*").order("name"),
  ]);
  return <TaxonomyEditor categories={(categories ?? []) as Category[]} tags={(tags ?? []) as Tag[]} />;
}
