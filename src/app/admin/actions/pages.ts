"use server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { SECTION_BY_TYPE } from "@/lib/sections";
import { dbError, logActivity, refreshSite, slugify, type ActionResult } from "@/lib/admin/util";

const slugRe = /^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$/;
const RESERVED = new Set(["admin", "api", "blog", "projects/", "_next", "sitemap.xml", "robots.txt"]);

const pageSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  slug: z.string().trim().min(1).max(120).regex(slugRe, "Use lowercase letters, numbers and hyphens"),
  status: z.enum(["draft", "published"]),
  show_in_sitemap: z.boolean(),
  needs_review: z.boolean(),
  review_note: z.string().trim().max(500).nullable(),
  seo_title: z.string().trim().max(70, "SEO title: 70 characters max").nullable(),
  seo_description: z.string().trim().max(200, "Meta description: 200 characters max").nullable(),
  og_image_id: z.string().uuid().nullable(),
  canonical_url: z.string().trim().max(300).nullable(),
  noindex: z.boolean(),
  sort_order: z.number().int(),
});

const sectionSchema = z.object({
  id: z.string().uuid().optional(),
  client_key: z.string().max(40).optional(),
  type: z.string().refine((t) => t in SECTION_BY_TYPE, "Unknown section type"),
  label: z.string().trim().max(80).nullable(),
  data: z.record(z.string(), z.unknown()),
  visible: z.boolean(),
  needs_review: z.boolean(),
  review_note: z.string().trim().max(500).nullable(),
});

const nul = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

export async function createPage(input: { title: string; slug?: string }): Promise<ActionResult<{ id: string }>> {
  const ctx = await assertAdmin();
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required" };
  const slug = slugify(input.slug?.trim() || title);
  if (!slugRe.test(slug) || RESERVED.has(slug) || slug.startsWith("admin") || slug.startsWith("api/")) {
    return { ok: false, error: "That URL is reserved or invalid. Choose another slug." };
  }
  const { data, error } = await ctx.supabase
    .from("pages")
    .insert({ title, slug, status: "draft", updated_by: ctx.userId })
    .select("id")
    .single();
  if (error) return { ok: false, error: dbError(error) };
  await ctx.supabase.from("page_sections").insert({
    page_id: data.id,
    type: "page_header",
    data: { heading: title },
    position: 0,
  });
  await logActivity(ctx, "created", "page", data.id, title);
  return { ok: true, data: { id: data.id } };
}

/** Saves page settings and the complete ordered list of sections in one go. */
export async function savePage(
  id: string,
  pageInput: z.infer<typeof pageSchema>,
  sectionsInput: z.infer<typeof sectionSchema>[],
): Promise<ActionResult<{ ids: Record<string, string> }>> {
  const ctx = await assertAdmin();
  const page = pageSchema.safeParse({
    ...pageInput,
    review_note: nul(pageInput.review_note),
    seo_title: nul(pageInput.seo_title),
    seo_description: nul(pageInput.seo_description),
    canonical_url: nul(pageInput.canonical_url),
  });
  if (!page.success) return { ok: false, error: page.error.issues[0].message };
  if (RESERVED.has(page.data.slug) || page.data.slug.startsWith("admin") || page.data.slug.startsWith("api/") || page.data.slug.startsWith("blog") || page.data.slug.startsWith("projects/")) {
    return { ok: false, error: "That URL is reserved. Choose another slug." };
  }
  const sections = z.array(sectionSchema).max(60).safeParse(sectionsInput);
  if (!sections.success) return { ok: false, error: sections.error.issues[0].message };

  const { data: existing } = await ctx.supabase.from("pages").select("status, published_at, slug").eq("id", id).single();
  if (existing?.slug === "home" && page.data.slug !== "home") return { ok: false, error: "The homepage slug cannot be changed." };
  const published_at =
    page.data.status === "published" ? existing?.published_at ?? new Date().toISOString() : existing?.published_at ?? null;

  const { error } = await ctx.supabase
    .from("pages")
    .update({ ...page.data, published_at, updated_by: ctx.userId })
    .eq("id", id);
  if (error) return { ok: false, error: dbError(error) };

  // Sync sections: delete removed, upsert the rest with new positions.
  const keepIds = sections.data.map((s) => s.id).filter(Boolean) as string[];
  const del = ctx.supabase.from("page_sections").delete().eq("page_id", id);
  const { error: delErr } = keepIds.length ? await del.not("id", "in", `(${keepIds.join(",")})`) : await del;
  if (delErr) return { ok: false, error: dbError(delErr) };

  const ids: Record<string, string> = {};
  const rows = sections.data.map(({ client_key, ...s }, i) => {
    const rowId = s.id ?? crypto.randomUUID();
    if (!s.id && client_key) ids[client_key] = rowId;
    return { ...s, id: rowId, page_id: id, position: i };
  });
  if (rows.length) {
    const { error: upErr } = await ctx.supabase.from("page_sections").upsert(rows);
    if (upErr) return { ok: false, error: dbError(upErr) };
  }

  await logActivity(ctx, existing?.status !== page.data.status ? (page.data.status === "published" ? "published" : "unpublished") : "updated", "page", id, page.data.title);
  refreshSite();
  return { ok: true, data: { ids }, message: "Page saved" };
}

export async function setPageStatus(id: string, status: "draft" | "published"): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const { data: p } = await ctx.supabase.from("pages").select("title, published_at").eq("id", id).single();
  const { error } = await ctx.supabase
    .from("pages")
    .update({ status, published_at: status === "published" ? p?.published_at ?? new Date().toISOString() : p?.published_at ?? null })
    .eq("id", id);
  if (error) return { ok: false, error: dbError(error) };
  await logActivity(ctx, status === "published" ? "published" : "unpublished", "page", id, p?.title ?? "");
  refreshSite();
  return { ok: true };
}

export async function deletePage(id: string): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const { data: p } = await ctx.supabase.from("pages").select("title, slug").eq("id", id).single();
  if (p?.slug === "home") return { ok: false, error: "The homepage cannot be deleted." };
  const { error } = await ctx.supabase.from("pages").delete().eq("id", id);
  if (error) return { ok: false, error: dbError(error) };
  await logActivity(ctx, "deleted", "page", id, p?.title ?? "");
  refreshSite();
  return { ok: true };
}

export async function duplicatePage(id: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await assertAdmin();
  const { data: p } = await ctx.supabase.from("pages").select("*").eq("id", id).single();
  if (!p) return { ok: false, error: "Page not found" };
  const { data: sections } = await ctx.supabase.from("page_sections").select("*").eq("page_id", id).order("position");
  let slug = `${p.slug}-copy`;
  for (let n = 2; n < 50; n++) {
    const { count } = await ctx.supabase.from("pages").select("id", { count: "exact", head: true }).eq("slug", slug);
    if (!count) break;
    slug = `${p.slug}-copy-${n}`;
  }
  const { data: copy, error } = await ctx.supabase
    .from("pages")
    .insert({
      title: `${p.title} (copy)`,
      slug,
      status: "draft",
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      og_image_id: p.og_image_id,
      updated_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: dbError(error) };
  if (sections?.length) {
    await ctx.supabase.from("page_sections").insert(
      sections.map((s) => ({ page_id: copy.id, type: s.type, label: s.label, data: s.data, position: s.position, visible: s.visible })),
    );
  }
  await logActivity(ctx, "created", "page", copy.id, `${p.title} (copy)`);
  return { ok: true, data: { id: copy.id } };
}

export async function reorderPages(ids: string[]): Promise<ActionResult> {
  const ctx = await assertAdmin();
  for (let i = 0; i < ids.length; i++) {
    const { error } = await ctx.supabase.from("pages").update({ sort_order: i }).eq("id", ids[i]);
    if (error) return { ok: false, error: dbError(error) };
  }
  refreshSite();
  return { ok: true };
}
