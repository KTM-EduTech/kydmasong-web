"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  Briefcase,
  FileText,
  FolderKanban,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu,
  Newspaper,
  Route,
  Settings,
  Sparkles,
  Tags,
  UserCog,
  Wrench,
  X,
} from "@/components/icons";
import clsx from "clsx";
import { signOut } from "@/app/admin/actions/auth";
import { ThemeToggle } from "@/components/site/ThemeToggle";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { group: "Content" },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/experience", label: "Work experience", icon: Briefcase },
  { href: "/admin/skills", label: "Skills", icon: Sparkles },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/taxonomies", label: "Categories & tags", icon: Tags },
  { href: "/admin/media", label: "Media library", icon: ImageIcon },
  { group: "Site" },
  { href: "/admin/navigation", label: "Navigation", icon: ListTree },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox, badge: true },
  { href: "/admin/redirects", label: "Redirects", icon: Route },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/account", label: "Account & security", icon: UserCog },
] as const;

/** Logo from Settings (same as the public header/footer); site name as text if no logo is set. */
function Brand({ siteName, logoUrl, logoAlt }: { siteName: string; logoUrl: string; logoAlt: string }) {
  return logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={logoAlt || siteName} className="h-9 w-auto" />
  ) : (
    <p className="font-semibold text-white">{siteName}</p>
  );
}

export function AdminShell({
  children,
  email,
  newEnquiries,
  blogEnabled,
  siteName,
  logoUrl,
  logoAlt,
}: {
  children: React.ReactNode;
  email: string;
  newEnquiries: number;
  blogEnabled: boolean;
  siteName: string;
  logoUrl: string;
  logoAlt: string;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string, exact?: boolean) => (exact ? path === href : path === href || path.startsWith(href + "/"));
  const nav = (
    <nav aria-label="Admin" className="space-y-0.5 p-3">
      {NAV.map((item, i) =>
        "group" in item ? (
          <p key={i} className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
            {item.group}
          </p>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition",
              isActive(item.href, "exact" in item ? item.exact : false) ? "bg-gold text-navy" : "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            <item.icon size={17} aria-hidden />
            <span className="flex-1">{item.label}</span>
            {"badge" in item && newEnquiries > 0 && (
              <span className="rounded-full bg-gold px-2 text-xs font-bold text-navy" aria-label={`${newEnquiries} new`}>
                {newEnquiries}
              </span>
            )}
            {item.href === "/admin/blog" && !blogEnabled && <span className="text-[10px] uppercase text-white/40">hidden</span>}
          </Link>
        ),
      )}
    </nav>
  );
  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden bg-navy lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
        <div className="border-b border-white/10 px-6 py-5">
          <Brand siteName={siteName} logoUrl={logoUrl} logoAlt={logoAlt} />
          <p className="mt-2 text-xs text-white/50">Content manager</p>
        </div>
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-navy">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <Brand siteName={siteName} logoUrl={logoUrl} logoAlt={logoAlt} />
              <button onClick={() => setOpen(false)} className="text-white" aria-label="Close menu">
                <X />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur md:px-8">
          <button className="rounded-lg p-2 hover:bg-bg-alt lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-bg-alt">
            View site <ArrowUpRight size={15} />
          </a>
          <ThemeToggle />
          <span className="hidden text-sm text-muted md:inline">{email}</span>
          <form action={signOut}>
            <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-bg-alt">
              <LogOut size={15} /> Sign out
            </button>
          </form>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
