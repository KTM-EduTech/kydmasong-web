import Link from "next/link";
import { AlertTriangle, FilePlus2, FolderPlus, Inbox, Newspaper, Settings, Upload } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { PageHeading } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const count = (table: string, col?: string, val?: string | boolean) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (col) q = q.eq(col, val as string);
    return q.then((r) => r.count ?? 0);
  };
  const [pubPages, draftPages, pubProjects, draftProjects, featured, posts, draftPosts, media, newEnq, activity, reviewPages, reviewSections, reviewProjects, reviewExp] =
    await Promise.all([
      count("pages", "status", "published"),
      count("pages", "status", "draft"),
      count("projects", "status", "published"),
      count("projects", "status", "draft"),
      count("projects", "featured", true),
      count("articles", "status", "published"),
      count("articles", "status", "draft"),
      count("media"),
      count("contact_submissions", "status", "new"),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(12),
      supabase.from("pages").select("id, title, review_note").eq("needs_review", true),
      supabase.from("page_sections").select("id, page_id, type, review_note, pages(title)").eq("needs_review", true),
      supabase.from("projects").select("id, title, review_note").eq("needs_review", true),
      supabase.from("experiences").select("id, role, organization, review_note").eq("needs_review", true),
    ]);

  const stats = [
    { label: "Published pages", value: pubPages, sub: `${draftPages} draft`, href: "/admin/pages" },
    { label: "Published projects", value: pubProjects, sub: `${draftProjects} draft · ${featured} featured`, href: "/admin/projects" },
    { label: "Blog posts", value: posts, sub: `${draftPosts} draft`, href: "/admin/blog" },
    { label: "Media files", value: media, sub: "in the library", href: "/admin/media" },
    { label: "New enquiries", value: newEnq, sub: "unread", href: "/admin/enquiries", highlight: newEnq > 0 },
  ];

  type Review = { key: string; label: string; note: string | null; href: string };
  const reviews: Review[] = [
    ...(reviewPages.data ?? []).map((p) => ({ key: "p" + p.id, label: `Page: ${p.title}`, note: p.review_note, href: `/admin/pages/${p.id}` })),
    ...((reviewSections.data ?? []) as unknown as { id: string; page_id: string; type: string; review_note: string | null; pages: { title: string } | null }[]).map((s) => ({
      key: "s" + s.id,
      label: `Section on ${s.pages?.title ?? "page"} (${s.type.replace(/_/g, " ")})`,
      note: s.review_note,
      href: `/admin/pages/${s.page_id}`,
    })),
    ...(reviewProjects.data ?? []).map((p) => ({ key: "r" + p.id, label: `Project: ${p.title}`, note: p.review_note, href: `/admin/projects/${p.id}` })),
    ...(reviewExp.data ?? []).map((e) => ({ key: "e" + e.id, label: `Experience: ${e.role}, ${e.organization}`, note: e.review_note, href: `/admin/experience` })),
  ];

  return (
    <>
      <PageHeading title="Dashboard" description="An overview of your website content." />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className={`block rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${s.highlight ? "border-gold bg-gold/20" : "border-line bg-surface"}`}>
              <p className="text-sm text-muted">{s.label}</p>
              <p className="mt-1 text-3xl font-semibold">{s.value}</p>
              <p className="mt-1 text-xs text-muted">{s.sub}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/pages?new=1", label: "New page", icon: FilePlus2 },
            { href: "/admin/projects/new", label: "New project", icon: FolderPlus },
            { href: "/admin/blog/new", label: "New blog post", icon: Newspaper },
            { href: "/admin/media", label: "Upload media", icon: Upload },
            { href: "/admin/enquiries", label: "Read enquiries", icon: Inbox },
            { href: "/admin/settings", label: "Site settings", icon: Settings },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-navy">
              <a.icon size={16} /> {a.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface">
          <h2 className="flex items-center gap-2 border-b border-line px-5 py-3.5 font-semibold">
            <AlertTriangle size={17} className="text-orange-600" /> Needs your review ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="p-5 text-sm text-muted">Nothing is waiting for review.</p>
          ) : (
            <ul className="divide-y divide-line">
              {reviews.map((r) => (
                <li key={r.key}>
                  <Link href={r.href} className="block px-5 py-3 hover:bg-bg-alt">
                    <p className="text-sm font-semibold">{r.label}</p>
                    {r.note && <p className="text-sm text-muted">{r.note}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-line bg-surface">
          <h2 className="border-b border-line px-5 py-3.5 font-semibold">Recent updates</h2>
          {(activity.data ?? []).length === 0 ? (
            <p className="p-5 text-sm text-muted">No changes yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(activity.data ?? []).map((a) => (
                <li key={a.id} className="flex items-baseline justify-between gap-3 px-5 py-3 text-sm">
                  <span>
                    <span className="font-semibold capitalize">{a.action}</span> {a.entity}: {a.label}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
