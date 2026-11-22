import type { Media } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Public URL for a media record. The version query busts caches after "Replace". */
export function mediaUrl(m: Pick<Media, "storage_path" | "external_url" | "updated_at"> | null | undefined): string {
  if (!m) return "";
  if (m.storage_path) {
    const v = new Date(m.updated_at).getTime();
    const path = m.storage_path.split("/").map(encodeURIComponent).join("/");
    return `${SUPABASE_URL}/storage/v1/object/public/media/${path}?v=${v}`;
  }
  return m.external_url ?? "";
}

export type MediaMap = Record<string, Media>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Collect media ids referenced anywhere inside section data (keys ending in _id or _ids). */
export function collectMediaIds(value: unknown, into = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectMediaIds(v, into));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if ((k.endsWith("_id") || k === "media_id") && typeof v === "string" && UUID.test(v)) into.add(v);
      else if (k.endsWith("_ids") && Array.isArray(v)) v.forEach((x) => typeof x === "string" && UUID.test(x) && into.add(x));
      else collectMediaIds(v, into);
    }
  }
  return into;
}
