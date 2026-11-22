import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getProjectBySlug, getProjects } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { renderRichText } from "@/lib/richtext/render";
import { MediaImage } from "@/components/blocks/MediaImage";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  const { projects } = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getProjectBySlug((await params).slug);
  if (!r) return {};
  const cover = r.project.cover_id ? r.media[r.project.cover_id] : undefined;
  return {
    title: r.project.seo_title || r.project.title,
    description: r.project.seo_description || r.project.summary || undefined,
    alternates: { canonical: `/projects/${r.project.slug}` },
    robots: r.project.status !== "published" ? { index: false } : undefined,
    openGraph: { images: cover ? [mediaUrl(cover)] : undefined },
  };
}

export default async function ProjectPage({ params }: Props) {
  const r = await getProjectBySlug((await params).slug);
  if (!r) notFound();
  const { project: p, media, tags, category } = r;
  const html = renderRichText(p.body);
  return (
    <article>
      <header className="container-site pb-12 pt-10 md:pt-14">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft size={16} aria-hidden /> All projects
        </Link>
        {p.status !== "published" && <p className="mt-4 inline-block rounded-full bg-gold px-3 py-1 text-sm font-semibold text-navy">Draft preview</p>}
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            {category && <p className="eyebrow mb-4">{category.name}</p>}
            <h1 className="display !text-[clamp(2.25rem,5vw,3.75rem)]">{p.title}</h1>
            {p.summary && <p className="mt-6 text-lg text-muted md:text-xl">{p.summary}</p>}
          </div>
          {p.links.length > 0 && (
            <ul className="flex flex-wrap gap-3 lg:justify-end">
              {p.links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 font-semibold text-navy transition hover:-translate-y-0.5">
                    {l.label} <ArrowUpRight size={16} aria-hidden />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
      {p.cover_id && media[p.cover_id] && (
        <div className="container-site">
          <div className="overflow-hidden rounded-[2rem] border border-line bg-navy">
            <MediaImage id={p.cover_id} media={media} priority className="h-auto w-full" sizes="(min-width: 1200px) 1200px, 100vw" />
          </div>
        </div>
      )}
      <div className="container-site max-w-3xl py-14">
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
      {p.gallery_ids.length > 0 && (
        <div className="container-site grid gap-5 pb-10 md:grid-cols-2">
          {p.gallery_ids.map((id) => (
            <MediaImage key={id} id={id} media={media} className="h-auto w-full rounded-2xl border border-line" sizes="(min-width: 768px) 50vw, 100vw" />
          ))}
        </div>
      )}
    </article>
  );
}
