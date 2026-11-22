"use server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { dbError, logActivity, refreshSite, slugify, type ActionResult } from "@/lib/admin/util";

const slugRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v ? v : null));
const optUrl = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^(https?:\/\/|\/|mailto:)/.test(v), "Links must start with https://, / or mailto:");
const links = z
  .array(z.object({ label: z.string().trim().min(1).max(80), url: z.string().trim().regex(/^(https?:\/\/|\/)/, "Link URLs must start with https:// or /") }))
  .max(10);
const status = z.enum(["draft", "published"]);
const uuidOrNull = z.string().uuid().nullable();

type Table = "projects" | "articles" | "experiences" | "skills" | "services";

async function saveRow(table: Table, id: string | null, row: Record<string, unknown>, label: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await assertAdmin();
  const q = id
    ? ctx.supabase.from(table).update(row as never).eq("id", id).select("id").single()
    : ctx.supabase.from(table).insert(row as never).select("id").single();
  const { data, error } = await q;
  if (error) return { ok: false, error: dbError(error) };
  await logActivity(ctx, id ? "updated" : "created", table.replace(/s$/, ""), data.id, label);
  refreshSite();
  return { ok: true, data: { id: data.id }, message: "Saved" };
}

async function deleteRow(table: Table, id: string, label: string): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const { error } = await ctx.supabase.from(table).delete().eq("id", id);
  if (error) return { ok: false, error: dbError(error) };
  await logActivity(ctx, "deleted", table.replace(/s$/, ""), id, label);
  refreshSite();
  return { ok: true };
}

async function reorder(table: Table, ids: string[], column: "sort_order" | "featured_order" = "sort_order"): Promise<ActionResult> {
  const ctx = await assertAdmin();
  for (let i = 0; i < ids.length; i++) {
    const { error } = await ctx.supabase.from(table).update({ [column]: i }).eq("id", ids[i]);
    if (error) return { ok: false, error: dbError(error) };
  }
  refreshSite();
  return { ok: true };
}

async function setTags(table: "project_tags" | "article_tags", key: "project_id" | "article_id", id: string, tagIds: string[]) {
  const ctx = await assertAdmin();
  await ctx.supabase.from(table).delete().eq(key, id);
  if (tagIds.length) await ctx.supabase.from(table).insert(tagIds.map((t) => ({ [key]: id, tag_id: t })));
}

/* ------------------------------------------------------------- Projects */
const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  slug: z.string().trim().max(120),
  summary: optText(600),
  body: z.unknown().nullable(),
  cover_id: uuidOrNull,
  gallery_ids: z.array(z.string().uuid()).max(24),
  links,
  category_id: uuidOrNull,
  featured: z.boolean(),
  status,
  needs_review: z.boolean(),
  review_note: optText(500),
  seo_title: optText(70),
  seo_description: optText(200),
});

export async function saveProject(id: string | null, input: z.input<typeof projectSchema>, tagIds: string[]): Promise<ActionResult<{ id: string }>> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const slug = slugify(parsed.data.slug || parsed.data.title).replace(/\//g, "-");
  if (!slugRe.test(slug)) return { ok: false, error: "Invalid slug" };
  const res = await saveRow("projects", id, { ...parsed.data, slug }, parsed.data.title);
  if (res.ok && res.data) await setTags("project_tags", "project_id", res.data.id, z.array(z.string().uuid()).parse(tagIds));
  return res;
}
export async function deleteProject(id: string, label: string) {
  return deleteRow("projects", id, label);
}
export async function reorderProjects(ids: string[]) {
  return reorder("projects", ids);
}
export async function reorderFeaturedProjects(ids: string[]) {
  return reorder("projects", ids, "featured_order");
}

/* ------------------------------------------------------------- Articles */
const articleSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.string().trim().max(120),
  excerpt: optText(400),
  body: z.unknown().nullable(),
  featured_image_id: uuidOrNull,
  category_id: uuidOrNull,
  status,
  published_at: z.string().datetime({ offset: true }).nullable(),
  seo_title: optText(70),
  seo_description: optText(200),
});

export async function saveArticle(id: string | null, input: z.input<typeof articleSchema>, tagIds: string[]): Promise<ActionResult<{ id: string }>> {
  const parsed = articleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const slug = slugify(parsed.data.slug || parsed.data.title).replace(/\//g, "-");
  if (!slugRe.test(slug)) return { ok: false, error: "Invalid slug" };
  const published_at = parsed.data.status === "published" ? parsed.data.published_at ?? new Date().toISOString() : parsed.data.published_at;
  const res = await saveRow("articles", id, { ...parsed.data, slug, published_at }, parsed.data.title);
  if (res.ok && res.data) await setTags("article_tags", "article_id", res.data.id, z.array(z.string().uuid()).parse(tagIds));
  return res;
}
export async function deleteArticle(id: string, label: string) {
  return deleteRow("articles", id, label);
}

/* ----------------------------------------------------------- Experience */
const experienceSchema = z.object({
  role: z.string().trim().min(1, "Role is required").max(160),
  organization: z.string().trim().min(1, "Organisation is required").max(160),
  organization_url: optUrl,
  location: optText(120),
  start_label: optText(40),
  end_label: optText(40),
  sort_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  logo_id: uuidOrNull,
  summary: optText(1000),
  bullets: z.array(z.string().trim().min(1).max(500)).max(20),
  links,
  status,
  needs_review: z.boolean(),
  review_note: optText(500),
});
export async function saveExperience(id: string | null, input: z.input<typeof experienceSchema>) {
  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  return saveRow("experiences", id, parsed.data, `${parsed.data.role}, ${parsed.data.organization}`);
}
export async function deleteExperience(id: string, label: string) {
  return deleteRow("experiences", id, label);
}
export async function reorderExperiences(ids: string[]) {
  return reorder("experiences", ids);
}

/* --------------------------------------------------------------- Skills */
const skillSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  category: z.string().trim().min(1, "Category is required").max(60),
  description: optText(300),
  url: optUrl,
  status,
});
export async function saveSkill(id: string | null, input: z.input<typeof skillSchema>) {
  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  return saveRow("skills", id, parsed.data, parsed.data.name);
}
export async function deleteSkill(id: string, label: string) {
  return deleteRow("skills", id, label);
}
export async function reorderSkills(ids: string[]) {
  return reorder("skills", ids);
}

/* ------------------------------------------------------------- Services */
const serviceSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  summary: optText(400),
  details: optText(3000),
  image_id: uuidOrNull,
  cta_label: optText(40),
  cta_url: optUrl,
  show_on_home: z.boolean(),
  status,
});
export async function saveService(id: string | null, input: z.input<typeof serviceSchema>) {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  return saveRow("services", id, parsed.data, parsed.data.title);
}
export async function deleteService(id: string, label: string) {
  return deleteRow("services", id, label);
}
export async function reorderServices(ids: string[]) {
  return reorder("services", ids);
}

/* ----------------------------------------------------- Categories & tags */
export async function saveTaxonomy(kind: "categories" | "tags", scope: "project" | "article", id: string | null, name: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await assertAdmin();
  const clean = name.trim();
  if (!clean || clean.length > 80) return { ok: false, error: "Name must be 1–80 characters" };
  const slug = slugify(clean).replace(/\//g, "-");
  const row = { name: clean, slug, scope };
  const q = id
    ? ctx.supabase.from(kind).update(row).eq("id", id).select("id").single()
    : ctx.supabase.from(kind).insert(row).select("id").single();
  const { data, error } = await q;
  if (error) return { ok: false, error: error.code === "23505" ? "That name already exists." : dbError(error) };
  refreshSite();
  return { ok: true, data: { id: data.id } };
}
export async function deleteTaxonomy(kind: "categories" | "tags", id: string): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const { error } = await ctx.supabase.from(kind).delete().eq("id", id);
  if (error) return { ok: false, error: dbError(error) };
  refreshSite();
  return { ok: true };
}
