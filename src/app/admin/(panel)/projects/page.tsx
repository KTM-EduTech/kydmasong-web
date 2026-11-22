import { requireAdmin } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import type { Media } from "@/lib/types";
import { ProjectsList } from "./ProjectsList";

export const metadata = { title: "Projects" };

export default async function ProjectsAdmin() {
  const { supabase } = await requireAdmin();
  const [{ data: projects }, { data: categories }] = await Promise.all([
    supabase.from("projects").select("id, title, slug, status, featured, featured_order, sort_order, needs_review, category_id, cover_id").order("sort_order"),
    supabase.from("categories").select("id, name").eq("scope", "project"),
  ]);
  const ids = (projects ?? []).map((p) => p.cover_id).filter(Boolean) as string[];
  const { data: media } = ids.length ? await supabase.from("media").select("*").in("id", ids) : { data: [] };
  const thumbs = Object.fromEntries(((media ?? []) as Media[]).map((m) => [m.id, mediaUrl(m)]));
  return <ProjectsList projects={projects ?? []} categories={categories ?? []} thumbs={thumbs} />;
}
