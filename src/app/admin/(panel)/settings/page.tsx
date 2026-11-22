import { requireAdmin } from "@/lib/auth";
import { parseSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  return <SettingsForm initial={parseSettings(data?.data)} />;
}
