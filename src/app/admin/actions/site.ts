"use server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { settingsSchema } from "@/lib/settings";
import { dbError, logActivity, refreshSite, type ActionResult } from "@/lib/admin/util";

/* ------------------------------------------------------------- Settings */
export async function saveSettings(input: unknown): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { ok: false, error: `${i.path.join(".")}: ${i.message}` };
  }
  const { error } = await ctx.supabase.from("site_settings").upsert({ id: 1, data: parsed.data });
  if (error) return { ok: false, error: dbError(error) };
  await logActivity(ctx, "updated", "settings", "1", "Site settings");
  refreshSite();
  return { ok: true, message: "Settings saved" };
}

/* ----------------------------------------------------------- Navigation */
const MENUS = ["header", "footer_resources", "footer_quick_links", "footer_tools", "footer_legal"] as const;
const navItem = z.object({
  id: z.string(),
  parent_id: z.string().nullable(),
  label: z.string().trim().min(1, "Every item needs a label").max(80),
  page_id: z.string().uuid().nullable(),
  url: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .transform((v) => (v ? v : null)),
  open_in_new_tab: z.boolean(),
  is_button: z.boolean(),
  enabled: z.boolean(),
});

/** Replace a whole menu with the submitted tree (order = array order). */
export async function saveMenu(menu: string, items: z.input<typeof navItem>[]): Promise<ActionResult> {
  const ctx = await assertAdmin();
  if (!(MENUS as readonly string[]).includes(menu)) return { ok: false, error: "Unknown menu" };
  const parsed = z.array(navItem).max(80).safeParse(items);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  for (const i of parsed.data) {
    if (!i.page_id && !i.url) return { ok: false, error: `"${i.label}" needs a page or a URL` };
    if (i.url && !/^(https?:\/\/|\/|mailto:|#)/.test(i.url)) return { ok: false, error: `"${i.label}": URLs must start with https://, / or mailto:` };
  }
  // Temporary client ids -> real uuids (keeps parent links intact).
  const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
  const idMap = new Map<string, string>();
  for (const i of parsed.data) idMap.set(i.id, isUuid(i.id) ? i.id : crypto.randomUUID());

  const { error: delErr } = await ctx.supabase.from("nav_items").delete().eq("menu", menu);
  if (delErr) return { ok: false, error: dbError(delErr) };
  const rows = parsed.data.map((i, idx) => ({
    id: idMap.get(i.id)!,
    menu,
    parent_id: i.parent_id ? idMap.get(i.parent_id) ?? null : null,
    label: i.label,
    page_id: i.page_id,
    url: i.page_id ? null : i.url,
    open_in_new_tab: i.open_in_new_tab,
    is_button: i.is_button,
    enabled: i.enabled,
    position: idx,
  }));
  // Parents first so the foreign key is satisfied.
  const parents = rows.filter((r) => !r.parent_id);
  const children = rows.filter((r) => r.parent_id);
  if (parents.length) {
    const { error } = await ctx.supabase.from("nav_items").insert(parents);
    if (error) return { ok: false, error: dbError(error) };
  }
  if (children.length) {
    const { error } = await ctx.supabase.from("nav_items").insert(children);
    if (error) return { ok: false, error: dbError(error) };
  }
  await logActivity(ctx, "updated", "navigation", menu, `Menu: ${menu}`);
  refreshSite();
  return { ok: true, message: "Menu saved" };
}

/* ------------------------------------------------------------ Redirects */
const redirectSchema = z.object({
  source: z.string().trim().regex(/^\/[^\s]*$/, "Source must start with / and contain no spaces").max(300),
  destination: z.string().trim().min(1).max(500).regex(/^(https?:\/\/|\/)/, "Destination must start with / or https://"),
  status_code: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]),
  enabled: z.boolean(),
});
export async function saveRedirect(id: string | null, input: z.input<typeof redirectSchema>): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const parsed = redirectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (parsed.data.source === parsed.data.destination) return { ok: false, error: "A redirect cannot point to itself." };
  const { error } = id
    ? await ctx.supabase.from("redirects").update(parsed.data).eq("id", id)
    : await ctx.supabase.from("redirects").insert(parsed.data);
  if (error) return { ok: false, error: error.code === "23505" ? "A redirect for that path already exists." : dbError(error) };
  await logActivity(ctx, id ? "updated" : "created", "redirect", id, parsed.data.source);
  refreshSite();
  return { ok: true, message: "Redirect saved" };
}
export async function deleteRedirect(id: string): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const { error } = await ctx.supabase.from("redirects").delete().eq("id", id);
  if (error) return { ok: false, error: dbError(error) };
  refreshSite();
  return { ok: true };
}

/* ------------------------------------------------------------ Enquiries */
export async function setEnquiryStatus(id: string, status: "new" | "read" | "archived"): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const { error } = await ctx.supabase.from("contact_submissions").update({ status }).eq("id", id);
  return error ? { ok: false, error: dbError(error) } : { ok: true };
}
export async function deleteEnquiry(id: string): Promise<ActionResult> {
  const ctx = await assertAdmin();
  const { error } = await ctx.supabase.from("contact_submissions").delete().eq("id", id);
  if (error) return { ok: false, error: dbError(error) };
  await logActivity(ctx, "deleted", "enquiry", id, "Enquiry");
  return { ok: true };
}
