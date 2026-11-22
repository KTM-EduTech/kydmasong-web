"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X, ArrowUpRight } from "lucide-react";
import type { ResolvedNavItem } from "@/lib/types";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  items: ResolvedNavItem[];
  logoUrl: string;
  logoAlt: string;
  logoOnBadge: boolean;
  siteName: string;
};

const isExternal = (href: string) => /^https?:\/\//.test(href);

function NavLink({ item, className, onClick }: { item: ResolvedNavItem; className?: string; onClick?: () => void }) {
  const ext = item.open_in_new_tab || isExternal(item.href);
  return (
    <Link
      href={item.href}
      className={className}
      onClick={onClick}
      {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {item.label}
      {ext && <ArrowUpRight size={14} className="ml-1 inline opacity-60" aria-hidden />}
      {ext && <span className="sr-only"> (opens in a new tab)</span>}
    </Link>
  );
}

export function Header({ items, logoUrl, logoAlt, logoOnBadge, siteName }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change (state derived during render) and on Escape / outside click.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setOpenMenu(null);
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpenMenu(null), setOpen(false));
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));
  const regular = items.filter((i) => !i.is_button);
  const buttons = items.filter((i) => i.is_button);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-line bg-bg/85 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-navy">
        Skip to content
      </a>
      <div className="container-site flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${siteName} home`}>
          {logoUrl ? (
            <span className={logoOnBadge ? "rounded-xl bg-navy px-3 py-1.5" : ""}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={logoAlt} className="h-9 w-auto" />
            </span>
          ) : (
            <span className="text-lg font-semibold">{siteName}</span>
          )}
        </Link>

        <nav ref={navRef} aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {regular.map((item) =>
            item.children.length ? (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  aria-expanded={openMenu === item.id}
                  aria-haspopup="true"
                  onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                  onMouseEnter={() => setOpenMenu(item.id)}
                  className={`flex items-center gap-1 rounded-full px-4 py-2 text-[15px] font-medium transition hover:bg-bg-alt ${
                    active(item.href) || item.children.some((c) => active(c.href)) ? "text-ink" : "text-muted"
                  }`}
                >
                  {item.label}
                  <ChevronDown size={15} className={`transition ${openMenu === item.id ? "rotate-180" : ""}`} aria-hidden />
                </button>
                <div
                  onMouseLeave={() => setOpenMenu(null)}
                  className={`absolute left-0 top-full pt-3 transition ${
                    openMenu === item.id ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                  }`}
                >
                  <ul className="min-w-60 rounded-2xl border border-line bg-surface p-2 shadow-xl shadow-navy/10">
                    {item.children.map((c) => (
                      <li key={c.id}>
                        <NavLink
                          item={c}
                          className={`flex items-center rounded-xl px-4 py-2.5 text-[15px] transition hover:bg-bg-alt ${
                            active(c.href) ? "font-semibold text-ink" : "text-muted hover:text-ink"
                          }`}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <NavLink
                key={item.id}
                item={item}
                className={`rounded-full px-4 py-2 text-[15px] font-medium transition hover:bg-bg-alt ${
                  active(item.href) ? "text-ink" : "text-muted"
                }`}
              />
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {buttons.map((b) => (
            <NavLink
              key={b.id}
              item={b}
              className="hidden rounded-full bg-gold px-5 py-2.5 text-[15px] font-semibold text-on-gold transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/30 sm:inline-flex"
            />
          ))}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      <div
        id="mobile-nav"
        className={`fixed inset-x-0 top-20 bottom-0 overflow-y-auto bg-bg transition lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav aria-label="Mobile" className="container-site py-6">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id} className="border-b border-line py-2">
                {item.children.length ? (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-xl font-medium">
                      {item.label}
                      <ChevronDown size={20} className="transition group-open:rotate-180" aria-hidden />
                    </summary>
                    <ul className="pb-2 pl-3">
                      {item.children.map((c) => (
                        <li key={c.id}>
                          <NavLink item={c} className="block py-2 text-muted" onClick={() => setOpen(false)} />
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <NavLink item={item} className="block py-2 text-xl font-medium" onClick={() => setOpen(false)} />
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
