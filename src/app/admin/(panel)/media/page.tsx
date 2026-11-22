import { requireAdmin } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import type { Media } from "@/lib/types";
import { MediaLibrary } from "./MediaLibrary";

export const metadata = { title: "Media library" };

export default async function MediaPage() {
  const { supabase } = await requireAdmin();
  const [{ data: media }, { data: folders }] = await Promise.all([
    supabase.from("media").select("*").order("created_at", { ascending: false }),
    supabase.from("media_folders").select("*").order("name"),
  ]);
  return <MediaLibrary items={((media ?? []) as Media[]).map((m) => ({ ...m, url: mediaUrl(m) }))} folders={folders ?? []} />;
}
