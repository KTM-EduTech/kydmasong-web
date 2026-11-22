import Link from "next/link";
import { ArrowUp, ArrowUpRight, Mail, MapPin, Navigation } from "lucide-react";
import type { ResolvedNavItem } from "@/lib/types";
import type { SiteSettings } from "@/lib/settings";

const isExternal = (href: string) => /^https?:\/\//.test(href);

function FooterLinks({ title, items }: { title: string; items?: ResolvedNavItem[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-on-band/60">{title}</h2>
      <ul className="space-y-2.5">
        {items.map((i) => {
          const ext = i.open_in_new_tab || isExternal(i.href);
          return (
            <li key={i.id}>
              <Link
                href={i.href}
                className="link-underline text-[15px] text-on-band/85 hover:text-on-band"
                {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {i.label}
                {ext && <span className="sr-only"> (opens in a new tab)</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Footer({ settings: s, menus }: { settings: SiteSettings; menus: Record<string, ResolvedNavItem[]> }) {
  return (
    <footer className="mt-24 bg-band text-on-band">
      <div className="container-site py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-6">
            {s.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo_url} alt={s.logo_alt} className="h-10 w-auto" />
            ) : (
              <p className="text-xl font-semibold">{s.site_name}</p>
            )}
            {s.footer_description && <p className="max-w-md text-[15px] text-on-band/75">{s.footer_description}</p>}
            <ul className="space-y-2 text-[15px] text-on-band/85">
              {s.primary_location_label && (
                <li className="flex gap-2">
                  <MapPin size={18} className="mt-1 shrink-0 text-gold" aria-hidden />
                  <span>
                    <span className="sr-only">Based in: </span>Based in {s.primary_location_label}
                  </span>
                </li>
              )}
              {s.current_location_label && (
                <li className="flex gap-2">
                  <Navigation size={18} className="mt-1 shrink-0 text-gold" aria-hidden />
                  <span>Currently in {s.current_location_label}</span>
                </li>
              )}
              {s.email && (
                <li className="flex gap-2">
                  <Mail size={18} className="mt-1 shrink-0 text-gold" aria-hidden />
                  <a href={`mailto:${s.email}`} className="link-underline">
                    {s.email}
                  </a>
                </li>
              )}
            </ul>
            {s.availability && <p className="text-[15px] font-medium text-gold">{s.availability}</p>}
            {s.social.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Social media">
                {s.social.map((so) => (
                  <li key={so.url}>
                    <a
                      href={so.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-on-band/20 px-3.5 py-1.5 text-sm text-on-band/85 transition hover:border-gold hover:bg-gold hover:text-navy"
                    >
                      {so.platform}
                      <ArrowUpRight size={13} aria-hidden />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <FooterLinks title="Resources" items={menus.footer_resources} />
          <FooterLinks title="Quick links" items={menus.footer_quick_links} />
          <FooterLinks title="Tools" items={menus.footer_tools} />
        </div>
        <div className="mt-14 flex flex-col gap-6 border-t border-on-band/15 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-sm text-on-band/65">
            {s.copyright && <p>{s.copyright}</p>}
            {s.footer_tagline && <p>{s.footer_tagline}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {menus.footer_legal?.map((i) => (
              <Link
                key={i.id}
                href={i.href}
                className="text-sm text-on-band/75 hover:text-on-band"
                {...(isExternal(i.href) || i.open_in_new_tab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {i.label}
              </Link>
            ))}
            <a
              href="#main"
              className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:-translate-y-0.5"
            >
              <ArrowUp size={15} aria-hidden /> Back to top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
