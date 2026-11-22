import "server-only";
import { updateTag } from "next/cache";
import { CMS_TAG } from "@/lib/supabase/clients";
import type { AdminContext } from "@/lib/auth";

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

/** Expire all cached public reads so the change shows on the next request. */
export function refreshSite() {
  updateTag(CMS_TAG);
}

export async function logActivity(ctx: AdminContext, action: string, entity: string, entityId: string | null, label: string) {
  await ctx.supabase.from("activity_log").insert({ actor_id: ctx.userId, action, entity, entity_id: entityId, label: label.slice(0, 200) });
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/-*\/-*/g, "/")
    .replace(/^[-/]+|[-/]+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** Friendly message for common Postgres errors. */
export function dbError(error: { code?: string; message: string } | null): string {
  if (!error) return "Unknown error";
  if (error.code === "23505") return "That URL slug is already in use. Choose another.";
  if (error.code === "23514") return "One of the values is not allowed (check lengths and formats).";
  if (error.code === "42501") return "You do not have permission to do that.";
  return error.message;
}
