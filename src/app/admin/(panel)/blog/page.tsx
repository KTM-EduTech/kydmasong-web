import Link from "next/link";
import { Plus } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { PageHeading, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Blog" };

export default async function BlogAdmin() {
  const { supabase } = await requireAdmin();
  const [{ data: articles }, settings] = await Promise.all([
    supabase.from("articles").select("id, title, slug, status, published_at, updated_at").order("updated_at", { ascending: false }),
    getSettings(),
  ]);
  return (
    <>
      <PageHeading
        title="Blog"
        description="Write and manage articles."
        actions={
          <Link href="/admin/blog/new" className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy">
            <Plus size={16} /> New post
          </Link>
        }
      />
      {!settings.blog_enabled && (
        <p className="mb-5 rounded-xl border border-gold bg-gold/20 p-4 text-sm">
          The blog is <strong>hidden from the public</strong>. You can write and preview posts now. When you&apos;re ready, turn on “Blog enabled” in{" "}
          <Link href="/admin/settings" className="font-semibold underline">
            Settings
          </Link>{" "}
          and add a Blog link to the menu under Navigation.
        </p>
      )}
      {(articles ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-10 text-center text-muted">No posts yet.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {(articles ?? []).map((a) => (
            <li key={a.id}>
              <Link href={`/admin/blog/${a.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-bg-alt">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{a.title}</span>
                  <span className="block text-xs text-muted">
                    /blog/{a.slug} · {a.published_at ? `Publish date ${new Date(a.published_at).toLocaleDateString("en-GB")}` : "No publish date"}
                  </span>
                </span>
                <StatusBadge status={a.status === "published" && a.published_at && new Date(a.published_at) > new Date() ? "scheduled" : a.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
