import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { SectionRenderer } from "@/components/blocks/Blocks";
import { findRedirect, getMediaForSections, getMediaMap, getPageBySlug, getPublishedPageSlugs, getSettings } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

type Props = { params: Promise<{ slug?: string[] }> };

export const dynamicParams = true;
export const revalidate = 86400;

const toSlug = (parts?: string[]) => (parts?.length ? parts.map(decodeURIComponent).join("/").toLowerCase() : "home");

export async function generateStaticParams() {
  const pages = await getPublishedPageSlugs();
  return pages.map((p) => ({ slug: p.slug === "home" ? [] : p.slug.split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = toSlug((await params).slug);
  const result = await getPageBySlug(slug);
  if (!result) return {};
  const { page } = result;
  const s = await getSettings();
  const og = page.og_image_id ? (await getMediaMap([page.og_image_id]))[page.og_image_id] : undefined;
  const path = slug === "home" ? "/" : `/${slug}`;
  return {
    title: slug === "home" ? { absolute: page.seo_title || s.seo_default_title } : page.seo_title || page.title,
    description: page.seo_description || s.seo_default_description || undefined,
    alternates: { canonical: page.canonical_url || path },
    robots: page.noindex || page.status !== "published" ? { index: false, follow: false } : undefined,
    openGraph: {
      title: page.seo_title || page.title,
      description: page.seo_description || undefined,
      url: path,
      images: og ? [mediaUrl(og)] : s.seo_og_image_url ? [s.seo_og_image_url] : undefined,
    },
  };
}

export default async function CmsPage({ params }: Props) {
  const parts = (await params).slug;
  const slug = toSlug(parts);
  if (parts?.length === 1 && parts[0] === "home") permanentRedirect("/");

  const result = await getPageBySlug(slug);
  if (!result) {
    const path = "/" + (parts ?? []).join("/");
    const r = await findRedirect(path);
    if (r) {
      if (r.status_code === 301 || r.status_code === 308) permanentRedirect(r.destination);
      redirect(r.destination);
    }
    notFound();
  }

  const { page, sections } = result;
  const media = await getMediaForSections(sections);
  const hasHeading = ["hero", "page_header"].includes(sections[0]?.type ?? "");
  return (
    <>
      {!hasHeading && <h1 className="sr-only">{page.title}</h1>}
      {page.status !== "published" && (
        <p className="container-site mt-4 rounded-xl bg-gold/40 px-4 py-2 text-sm font-medium">Draft: only visible in preview.</p>
      )}
      <SectionRenderer sections={sections} media={media} />
    </>
  );
}
