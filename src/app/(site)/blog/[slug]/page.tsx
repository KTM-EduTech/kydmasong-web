import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getArticleBySlug, getArticles, getSettings, isPreview } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { renderRichText } from "@/lib/richtext/render";
import { MediaImage } from "@/components/blocks/MediaImage";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  const s = await getSettings();
  if (!s.blog_enabled) return [];
  const { articles } = await getArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getArticleBySlug((await params).slug);
  if (!r) return {};
  const img = r.article.featured_image_id ? r.media[r.article.featured_image_id] : undefined;
  return {
    title: r.article.seo_title || r.article.title,
    description: r.article.seo_description || r.article.excerpt || undefined,
    alternates: { canonical: `/blog/${r.article.slug}` },
    robots: r.article.status !== "published" ? { index: false } : undefined,
    openGraph: { type: "article", publishedTime: r.article.published_at ?? undefined, images: img ? [mediaUrl(img)] : undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const [settings, preview] = await Promise.all([getSettings(), isPreview()]);
  if (!settings.blog_enabled && !preview) notFound();
  const r = await getArticleBySlug((await params).slug);
  if (!r) notFound();
  const { article: a, media, tags, category } = r;
  const html = renderRichText(a.body);
  return (
    <article>
      <header className="container-site max-w-3xl pb-10 pt-10 md:pt-14">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft size={16} aria-hidden /> All articles
        </Link>
        <p className="mt-8 text-sm text-muted">
          {category && <span className="font-semibold">{category.name} · </span>}
          {a.status === "published" && a.published_at
            ? new Date(a.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
            : "Draft preview"}
        </p>
        <h1 className="mt-3 text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-tight tracking-tight">{a.title}</h1>
        {a.excerpt && <p className="mt-5 text-lg text-muted">{a.excerpt}</p>}
      </header>
      {a.featured_image_id && media[a.featured_image_id] && (
        <div className="container-site max-w-5xl">
          <MediaImage id={a.featured_image_id} media={media} priority className="h-auto w-full rounded-[2rem]" sizes="(min-width: 1024px) 1024px, 100vw" />
        </div>
      )}
      <div className="container-site max-w-3xl py-12">
        {html && <div className="rt text-[17px]" dangerouslySetInnerHTML={{ __html: html }} />}
        {tags.length > 0 && (
          <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
            {tags.map((t) => (
              <li key={t.id} className="rounded-full border border-line px-3.5 py-1 text-sm">
                {t.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
