import { requireAdmin } from "@/lib/auth";
import type { ContactSubmission } from "@/lib/types";
import { EnquiriesInbox } from "./EnquiriesInbox";

export const metadata = { title: "Enquiries" };

export default async function EnquiriesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(500);
  return <EnquiriesInbox items={(data ?? []) as ContactSubmission[]} />;
}
