import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import type { Article, Media } from "@/lib/types";
import { ArticleEditor } from "./ArticleEditor";

export const metadata = { title: "Edit post" };

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("scope", "article").order("name"),
    supabase.from("tags").select("id, name").eq("scope", "article").order("name"),
  ]);
  if (id === "new") {
    const blank = { title: "", slug: "", excerpt: null, body: null, featured_image_id: null, category_id: null, status: "draft" as const, published_at: null, seo_title: null, seo_description: null };
    return <ArticleEditor id={null} initial={blank} tagIds={[]} categories={categories ?? []} tags={tags ?? []} imageUrl={undefined} />;
  }
  const { data: a } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (!a) notFound();
  const { data: at } = await supabase.from("article_tags").select("tag_id").eq("article_id", id);
  const { data: img } = a.featured_image_id ? await supabase.from("media").select("*").eq("id", a.featured_image_id).maybeSingle() : { data: null };
  return (
    <ArticleEditor
      id={id}
      initial={a as Article}
      tagIds={(at ?? []).map((t) => t.tag_id)}
      categories={categories ?? []}
      tags={tags ?? []}
      imageUrl={img ? mediaUrl(img as Media) : undefined}
    />
  );
}
