"use server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { collectMediaIds, mediaUrl } from "@/lib/media";
import { dbError, logActivity, refreshSite, type ActionResult } from "@/lib/admin/util";
import type { Media } from "@/lib/types";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

export type MediaItem = Media & { url: string };

export async function listMedia(opts: { folderId?: string | null; q?: string; imagesOnly?: boolean } = {}): Promise<MediaItem[]> {
  const ctx = await assertAdmin();
  let q = ctx.supabase.from("media").select("*").order("created_at", { ascending: false }).limit(500);
  if (opts.folderId) q = q.eq("folder_id", opts.folderId);
  if (opts.q) q = q.or(`file_name.ilike.%${opts.q.replace(/[%,()]/g, "")}%,alt.ilike.%${opts.q.replace(/[%,()]/g, "")}%`);
  if (opts.imagesOnly) q = q.like("mime_type", "image/%");
  const { data } = await q;
  return ((data ?? []) as Media[]).map((m) => ({ ...m, url: mediaUrl(m) }));
}

const registerSchema = z.object({
  storage_path: z.string().min(1).max(300),
  file_name: z.string().min(1).max(200),
  mime_type: z.string().refine((m) => ALLOWED.includes(m), "File type not allowed"),
  size_bytes: z.number().int().positive().max(MAX_BYTES, "Files must be 10 MB or smaller"),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  alt: z.string().trim().max(300),
  folder_id: z.string().uuid().nullable(),
});

/** Called after the browser uploads the file to Storage with the admin's session. */
export async function registerMedia(input: z.input<typeof registerSchema>): Promise<ActionResult<{ id: string }>> {
  const ctx = await assertAdmin();
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    await ctx.supabase.storage.from("media").remove([input.storage_path]);
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { data, error } = await ctx.supabase.from("media").insert(parsed.data).select("id").single();
  if (error) return { ok: false, error: dbError(error) };
  await logActivity(ctx, "uploaded", "media", data.id, parsed.data.file_name);
  return { ok: true, data: { id: data.id } };
}

/** After "Replace": the file was overwritten at the same path; refresh metadata and bust caches. */
export async function touchMedia(id: string, meta: { size_bytes: number; width: number | null; height: number | null; mime_type: string }): Promise<ActionResult> {
  const ctx = await assertAdmin();
  if (!ALLOWED.includes(meta.mime_type)) return { ok: false, error: "File type not allowed" };
  const { error } = await ctx.supabase
    .from("media")
    .update({ ...meta, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: dbError(error) };
  await logActivity(ctx, "replaced", "media", id, "Media file");
  refreshSite();
  return { ok: true };
}

export async function updateMedia(id: string, input: { alt: string; caption: string | null; folder_id: string | null; file_name: string }): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const parsed = z
    .object({
      alt: z.string().trim().max(300),
      caption: z.string().trim().max(300).nullable(),
      folder_id: z.string().uuid().nullable(),
      file_name: z.string().trim().min(1).max(200),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { error } = await ctx.supabase.from("media").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: dbError(error) };
  refreshSite();
  return { ok: true, message: "Saved" };
}

/** Where is this media item used? Returns human-readable places. */
export async function findMediaUsage(id: string): Promise<string[]> {
  const ctx = await assertAdmin();
  const uses: string[] = [];
  const [sections, pages, projects, articles, experiences, services, settings] = await Promise.all([
    ctx.supabase.from("page_sections").select("data, pages(title)"),
    ctx.supabase.from("pages").select("title").eq("og_image_id", id),
    ctx.supabase.from("projects").select("title, cover_id, gallery_ids"),
    ctx.supabase.from("articles").select("title").eq("featured_image_id", id),
    ctx.supabase.from("experiences").select("role, organization").eq("logo_id", id),
    ctx.supabase.from("services").select("title").eq("image_id", id),
    ctx.supabase.from("site_settings").select("data").eq("id", 1).maybeSingle(),
  ]);
  for (const s of (sections.data ?? []) as unknown as { data: unknown; pages: { title: string } | null }[]) {
    if (collectMediaIds(s.data).has(id)) uses.push(`Page: ${s.pages?.title ?? "?"}`);
  }
  (pages.data ?? []).forEach((p) => uses.push(`Page social image: ${p.title}`));
  for (const p of projects.data ?? []) {
    if (p.cover_id === id || (p.gallery_ids as string[]).includes(id)) uses.push(`Project: ${p.title}`);
  }
  (articles.data ?? []).forEach((a) => uses.push(`Article: ${a.title}`));
  (experiences.data ?? []).forEach((e) => uses.push(`Experience: ${e.role}, ${e.organization}`));
  (services.data ?? []).forEach((s) => uses.push(`Service: ${s.title}`));
  const { data: m } = await ctx.supabase.from("media").select("storage_path, external_url, updated_at").eq("id", id).maybeSingle();
  const url = m ? mediaUrl(m).split("?")[0] : "";
  const sd = JSON.stringify(settings.data?.data ?? {});
  if (url && sd.includes(url)) uses.push("Site settings (logo, favicon or social image)");
  return [...new Set(uses)];
}

export async function deleteMedia(id: string, force = false): Promise<ActionResult<{ usage: string[] }>> {
  const ctx = await assertAdmin();
  const usage = await findMediaUsage(id);
  if (usage.length && !force) return { ok: false, error: `In use: ${usage.join("; ")}` };
  const { data: m } = await ctx.supabase.from("media").select("storage_path, file_name").eq("id", id).single();
  if (m?.storage_path) {
    const { error: sErr } = await ctx.supabase.storage.from("media").remove([m.storage_path]);
    if (sErr) return { ok: false, error: sErr.message };
  }
  const { error } = await ctx.supabase.from("media").delete().eq("id", id);
  if (error) return { ok: false, error: dbError(error) };
  await logActivity(ctx, "deleted", "media", id, m?.file_name ?? "");
  refreshSite();
  return { ok: true };
}

/** Add an image by URL without copying it (kept as an external link). */
export async function addExternalMedia(input: { url: string; alt: string; folder_id: string | null }): Promise<ActionResult<{ id: string }>> {
  const ctx = await assertAdmin();
  const url = z.string().url().refine((u) => u.startsWith("https://"), "Use an https:// URL").safeParse(input.url.trim());
  if (!url.success) return { ok: false, error: url.error.issues[0].message };
  const name = decodeURIComponent(new URL(url.data).pathname.split("/").pop() || "image");
  const { data, error } = await ctx.supabase
    .from("media")
    .insert({ external_url: url.data, file_name: name.slice(0, 200), mime_type: guessMime(name), alt: input.alt.trim().slice(0, 300), folder_id: input.folder_id })
    .select("id")
    .single();
  if (error) return { ok: false, error: dbError(error) };
  await logActivity(ctx, "added", "media", data.id, name);
  return { ok: true, data: { id: data.id } };
}

/** Copy an external image into Supabase Storage so the site no longer depends on the old host. */
export async function importExternalMedia(id: string): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const { data: m } = await ctx.supabase.from("media").select("*").eq("id", id).single();
  if (!m?.external_url) return { ok: false, error: "This item is already stored in the library." };
  let res: Response;
  try {
    res = await fetch(m.external_url, { cache: "no-store" });
  } catch {
    return { ok: false, error: "Could not download the file." };
  }
  if (!res.ok) return { ok: false, error: `Download failed (HTTP ${res.status}).` };
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!ALLOWED.includes(type)) return { ok: false, error: `Unsupported file type: ${type || "unknown"}` };
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) return { ok: false, error: "File is larger than 10 MB." };
  const ext = type === "image/svg+xml" ? "svg" : type.split("/")[1].replace("jpeg", "jpg");
  const base = (m.file_name as string).replace(/\.[a-z0-9]+$/i, "").replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 60) || "file";
  const path = `imported/${Date.now()}-${base}.${ext}`;
  const { error: upErr } = await ctx.supabase.storage.from("media").upload(path, buf, { contentType: type, upsert: false });
  if (upErr) return { ok: false, error: upErr.message };
  const { error } = await ctx.supabase
    .from("media")
    .update({ storage_path: path, external_url: null, mime_type: type, size_bytes: buf.byteLength, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: dbError(error) };
  await logActivity(ctx, "imported", "media", id, m.file_name);
  refreshSite();
  return { ok: true, message: "Copied into the media library" };
}

export async function saveFolder(id: string | null, name: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await assertAdmin();
  const n = name.trim();
  if (!n || n.length > 80) return { ok: false, error: "Folder names must be 1–80 characters" };
  const q = id
    ? ctx.supabase.from("media_folders").update({ name: n }).eq("id", id).select("id").single()
    : ctx.supabase.from("media_folders").insert({ name: n }).select("id").single();
  const { data, error } = await q;
  if (error) return { ok: false, error: error.code === "23505" ? "A folder with that name exists." : dbError(error) };
  return { ok: true, data: { id: data.id } };
}
export async function deleteFolder(id: string): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const { error } = await ctx.supabase.from("media_folders").delete().eq("id", id);
  return error ? { ok: false, error: dbError(error) } : { ok: true };
}

function guessMime(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return (
    { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", avif: "image/avif", svg: "image/svg+xml", pdf: "application/pdf" }[ext] ??
    "image/png"
  );
}
