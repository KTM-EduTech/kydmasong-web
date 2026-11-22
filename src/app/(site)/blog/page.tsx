import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getArticles, getSettings, isPreview } from "@/lib/data";
import { MediaImage } from "@/components/blocks/MediaImage";

export const revalidate = 86400;

export const metadata: Metadata = { title: "Blog", alternates: { canonical: "/blog" } };

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Not yet published";

export default async function BlogIndex() {
  const [settings, preview] = await Promise.all([getSettings(), isPreview()]);
  if (!settings.blog_enabled && !preview) notFound();
  const { articles, categories, media } = await getArticles();
  return (
    <>
      <section className="border-b border-line">
        <div className="container-site pb-14 pt-12 md:pt-16">
          <p className="eyebrow mb-5">Blog</p>
          <h1 className="display !text-[clamp(2.25rem,5vw,3.75rem)]">Articles and notes</h1>
        </div>
      </section>
      <section className="container-site py-14">
        {articles.length === 0 ? (
          <p className="text-muted">No articles yet.</p>
        ) : (
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <li key={a.id}>
                <Link href={`/blog/${a.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-surface transition hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/10">
                  <div className="relative aspect-[16/10] bg-navy">
                    {a.featured_image_id && <MediaImage id={a.featured_image_id} media={media} fill sizes="(min-width: 1024px) 33vw, 100vw" />}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-sm text-muted">
                      {categories.find((c) => c.id === a.category_id)?.name && (
                        <span className="font-semibold">{categories.find((c) => c.id === a.category_id)?.name} · </span>
                      )}
                      {a.status === "published" ? fmt(a.published_at) : "Draft"}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">{a.title}</h2>
                    {a.excerpt && <p className="mt-2 line-clamp-3 text-muted">{a.excerpt}</p>}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold">
                      Read article <ArrowRight size={15} className="transition group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
