import { requireAdmin } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import type { Experience, Media } from "@/lib/types";
import { ExperienceManager } from "./ExperienceManager";

export const metadata = { title: "Work experience" };

export default async function ExperienceAdmin() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("experiences").select("*").order("sort_order").order("sort_date", { ascending: false });
  const ids = (data ?? []).map((e) => e.logo_id).filter(Boolean) as string[];
  const { data: media } = ids.length ? await supabase.from("media").select("*").in("id", ids) : { data: [] };
  return <ExperienceManager items={(data ?? []) as Experience[]} logos={Object.fromEntries(((media ?? []) as Media[]).map((m) => [m.id, mediaUrl(m)]))} />;
}
