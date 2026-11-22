import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import type { Media, Project } from "@/lib/types";
import { ProjectEditor } from "./ProjectEditor";

export const metadata = { title: "Edit project" };

const blank: Omit<Project, "id" | "created_at" | "updated_at"> = {
  title: "",
  slug: "",
  summary: null,
  body: null,
  cover_id: null,
  gallery_ids: [],
  links: [],
  category_id: null,
  featured: false,
  featured_order: 0,
  sort_order: 0,
  status: "draft",
  needs_review: false,
  review_note: null,
  seo_title: null,
  seo_description: null,
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("scope", "project").order("name"),
    supabase.from("tags").select("id, name").eq("scope", "project").order("name"),
  ]);
  if (id === "new") return <ProjectEditor id={null} initial={blank} tagIds={[]} categories={categories ?? []} tags={tags ?? []} mediaUrls={{}} />;
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!project) notFound();
  const { data: pt } = await supabase.from("project_tags").select("tag_id").eq("project_id", id);
  const ids = [project.cover_id, ...(project.gallery_ids ?? [])].filter(Boolean);
  const { data: media } = ids.length ? await supabase.from("media").select("*").in("id", ids) : { data: [] };
  return (
    <ProjectEditor
      id={id}
      initial={project as Project}
      tagIds={(pt ?? []).map((t) => t.tag_id)}
      categories={categories ?? []}
      tags={tags ?? []}
      mediaUrls={Object.fromEntries(((media ?? []) as Media[]).map((m) => [m.id, mediaUrl(m)]))}
    />
  );
}
