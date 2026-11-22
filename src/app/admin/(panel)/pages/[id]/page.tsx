import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { collectMediaIds, mediaUrl } from "@/lib/media";
import type { Media, Page, Section } from "@/lib/types";
import { PageEditor } from "./PageEditor";

export const metadata = { title: "Edit page" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: page } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();
  if (!page) notFound();
  const { data: sections } = await supabase.from("page_sections").select("*").eq("page_id", id).order("position");
  const ids = collectMediaIds((sections ?? []).map((s) => s.data));
  if (page.og_image_id) ids.add(page.og_image_id);
  const { data: media } = ids.size ? await supabase.from("media").select("*").in("id", [...ids]) : { data: [] };
  const mediaUrls = Object.fromEntries(((media ?? []) as Media[]).map((m) => [m.id, mediaUrl(m)]));
  return <PageEditor page={page as Page} sections={(sections ?? []) as Section[]} mediaUrls={mediaUrls} />;
}
