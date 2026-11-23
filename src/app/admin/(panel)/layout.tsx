import { requireAdmin } from "@/lib/auth";
import { AdminDataProvider } from "@/components/admin/AdminData";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdmin();
  const [{ data: pages }, { count: newEnquiries }, settings] = await Promise.all([
    ctx.supabase.from("pages").select("id, title, slug").order("sort_order").order("title"),
    ctx.supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("status", "new"),
    getSettings(),
  ]);
  return (
    <AdminDataProvider value={{ pages: pages ?? [] }}>
      <AdminShell email={ctx.email} newEnquiries={newEnquiries ?? 0} blogEnabled={settings.blog_enabled} siteName={settings.site_name} logoUrl={settings.logo_url} logoAlt={settings.logo_alt}>
        {children}
      </AdminShell>
    </AdminDataProvider>
  );
}
