import { requireAdmin } from "@/lib/auth";
import type { Skill } from "@/lib/types";
import { SkillsManager } from "./SkillsManager";

export const metadata = { title: "Skills" };

export default async function SkillsAdmin() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("skills").select("*").order("sort_order");
  return <SkillsManager items={(data ?? []) as Skill[]} />;
}
