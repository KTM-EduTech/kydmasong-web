import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getNav, getSettings, isPreview } from "@/lib/data";
import Link from "next/link";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, menus, preview] = await Promise.all([getSettings(), getNav(), isPreview()]);
  return (
    <>
      {preview && (
        <div className="sticky top-0 z-[60] flex items-center justify-center gap-4 bg-gold px-4 py-2 text-sm font-medium text-navy">
          Preview mode: you are seeing drafts.
          <Link href="/api/preview/exit" prefetch={false} className="underline">
            Exit preview
          </Link>
        </div>
      )}
      <Header
        items={menus.header ?? []}
        logoUrl={settings.logo_url}
        logoAlt={settings.logo_alt}
        logoOnBadge={settings.logo_on_navy_badge}
        siteName={settings.site_name}
      />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer settings={settings} menus={menus} />
    </>
  );
}
