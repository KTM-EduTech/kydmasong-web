import { requireAdmin } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import type { Media, Service } from "@/lib/types";
import { ServicesManager } from "./ServicesManager";

export const metadata = { title: "Services" };

export default async function ServicesAdmin() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("services").select("*").order("sort_order");
  const ids = (data ?? []).map((s) => s.image_id).filter(Boolean) as string[];
  const { data: media } = ids.length ? await supabase.from("media").select("*").in("id", ids) : { data: [] };
  return <ServicesManager items={(data ?? []) as Service[]} images={Object.fromEntries(((media ?? []) as Media[]).map((m) => [m.id, mediaUrl(m)]))} />;
}
