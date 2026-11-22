import type { MetadataRoute } from "next";
import { getPublishedArticleSlugs, getPublishedPageSlugs, getPublishedProjectSlugs, getSettings } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kydmasong.net";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, projects, settings] = await Promise.all([getPublishedPageSlugs(), getPublishedProjectSlugs(), getSettings()]);
  const entries: MetadataRoute.Sitemap = pages
    .filter((p) => p.show_in_sitemap && !p.noindex)
    .map((p) => ({
      url: `${SITE_URL}${p.slug === "home" ? "/" : `/${p.slug}`}`,
      lastModified: p.updated_at,
      priority: p.slug === "home" ? 1 : 0.7,
    }));
  projects.forEach((p) => entries.push({ url: `${SITE_URL}/projects/${p.slug}`, lastModified: p.updated_at, priority: 0.6 }));
  if (settings.blog_enabled) {
    const articles = await getPublishedArticleSlugs();
    entries.push({ url: `${SITE_URL}/blog`, priority: 0.5 });
    articles.forEach((a) => entries.push({ url: `${SITE_URL}/blog/${a.slug}`, lastModified: a.updated_at, priority: 0.5 }));
  }
  return entries;
}
