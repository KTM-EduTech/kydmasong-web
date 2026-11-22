import "server-only";
import { draftMode } from "next/headers";
import { isSupabaseConfigured, publicClient, sessionClient } from "./supabase/clients";
import { parseSettings, type SiteSettings } from "./settings";
import { collectMediaIds, type MediaMap } from "./media";
import type {
  Article,
  Category,
  Experience,
  Media,
  NavItem,
  Page,
  Project,
  ResolvedNavItem,
  Section,
  Service,
  Skill,
  Tag,
} from "./types";

/**
 * Public data access. Normal visitors get the cached anonymous client (RLS:
 * published only). In draft mode (admin preview) we read with the admin's
 * session so drafts are visible.
 */
async function db() {
  const { isEnabled } = await draftMode();
  return isEnabled ? await sessionClient() : publicClient();
}

export async function isPreview() {
  return (await draftMode()).isEnabled;
}

export async function getSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) return parseSettings({});
  const { data } = await publicClient().from("site_settings").select("data").eq("id", 1).maybeSingle();
  return parseSettings(data?.data);
}

export async function getNav(): Promise<Record<string, ResolvedNavItem[]>> {
  if (!isSupabaseConfigured) return {};
  const client = publicClient();
  const [{ data: items }, { data: pages }] = await Promise.all([
    client.from("nav_items").select("*").eq("enabled", true).order("position"),
    client.from("pages").select("id, slug").eq("status", "published"),
  ]);
  const slugById = new Map((pages ?? []).map((p) => [p.id as string, p.slug as string]));
  const resolve = (i: NavItem): ResolvedNavItem | null => {
    let href = i.url ?? "";
    if (i.page_id) {
      const slug = slugById.get(i.page_id);
      if (!slug) return null; // linked page is unpublished: hide the item
      href = slug === "home" ? "/" : `/${slug}`;
    }
    return { ...i, href, children: [] };
  };
  const all = ((items ?? []) as NavItem[]).map(resolve).filter(Boolean) as ResolvedNavItem[];
  const byId = new Map(all.map((i) => [i.id, i]));
  const menus: Record<string, ResolvedNavItem[]> = {};
  for (const item of all) {
    if (item.parent_id) {
      byId.get(item.parent_id)?.children.push(item);
    } else {
      (menus[item.menu] ??= []).push(item);
    }
  }
  return menus;
}

export async function getPageBySlug(slug: string): Promise<{ page: Page; sections: Section[] } | null> {
  if (!isSupabaseConfigured) return null;
  const client = await db();
  const { data: page } = await client.from("pages").select("*").eq("slug", slug).maybeSingle();
  if (!page) return null;
  const { data: sections } = await client
    .from("page_sections")
    .select("*")
    .eq("page_id", page.id)
    .eq("visible", true)
    .order("position");
  return { page: page as Page, sections: (sections ?? []) as Section[] };
}

export async function getPublishedPageSlugs(): Promise<{ slug: string; updated_at: string; show_in_sitemap: boolean; noindex: boolean }[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await publicClient().from("pages").select("slug, updated_at, show_in_sitemap, noindex").eq("status", "published");
  return data ?? [];
}

/**
 * Published project/article slugs for build-time code (generateStaticParams,
 * sitemap). These use the anonymous client directly and never touch
 * draftMode(), which Next.js forbids outside a request.
 */
export async function getPublishedProjectSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await publicClient().from("projects").select("slug, updated_at").eq("status", "published").order("sort_order");
  return data ?? [];
}

export async function getPublishedArticleSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await publicClient()
    .from("articles")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return data ?? [];
}

export async function getMediaMap(ids: Iterable<string>): Promise<MediaMap> {
  const list = [...new Set(ids)];
  if (!isSupabaseConfigured || list.length === 0) return {};
  const client = await db();
  const { data } = await client.from("media").select("*").in("id", list);
  return Object.fromEntries(((data ?? []) as Media[]).map((m) => [m.id, m]));
}

export async function getMediaForSections(sections: Section[], extra: (string | null | undefined)[] = []) {
  const ids = collectMediaIds(sections.map((s) => s.data));
  extra.forEach((id) => id && ids.add(id));
  return getMediaMap(ids);
}

export async function getProjects(opts: { featuredOnly?: boolean; limit?: number } = {}) {
  if (!isSupabaseConfigured) return { projects: [] as Project[], categories: [] as Category[], media: {} as MediaMap };
  const client = await db();
  let q = client.from("projects").select("*").eq("status", "published");
  if (opts.featuredOnly) q = q.eq("featured", true).order("featured_order");
  q = q.order("sort_order");
  if (opts.limit) q = q.limit(opts.limit);
  const [{ data: projects }, { data: categories }] = await Promise.all([
    q,
    client.from("categories").select("*").eq("scope", "project").order("sort_order"),
  ]);
  const list = (projects ?? []) as Project[];
  const media = await getMediaMap(list.flatMap((p) => [p.cover_id, ...(p.gallery_ids ?? [])]).filter(Boolean) as string[]);
  return { projects: list, categories: (categories ?? []) as Category[], media };
}

export async function getProjectBySlug(slug: string) {
  if (!isSupabaseConfigured) return null;
  const client = await db();
  const { data: project } = await client.from("projects").select("*").eq("slug", slug).maybeSingle();
  if (!project) return null;
  const p = project as Project;
  const [{ data: tagRows }, { data: category }] = await Promise.all([
    client.from("project_tags").select("tags(id, name, slug)").eq("project_id", p.id),
    p.category_id ? client.from("categories").select("*").eq("id", p.category_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const tags = ((tagRows ?? []) as unknown as { tags: Tag }[]).map((r) => r.tags).filter(Boolean);
  const media = await getMediaMap([p.cover_id, ...(p.gallery_ids ?? [])].filter(Boolean) as string[]);
  return { project: p, tags, category: category as Category | null, media };
}

export async function getExperiences() {
  if (!isSupabaseConfigured) return { items: [] as Experience[], media: {} as MediaMap };
  const client = await db();
  const { data } = await client
    .from("experiences")
    .select("*")
    .eq("status", "published")
    .order("sort_order")
    .order("sort_date", { ascending: false });
  const items = (data ?? []) as Experience[];
  const media = await getMediaMap(items.map((e) => e.logo_id).filter(Boolean) as string[]);
  return { items, media };
}

export async function getSkills() {
  if (!isSupabaseConfigured) return [] as Skill[];
  const client = await db();
  const { data } = await client.from("skills").select("*").eq("status", "published").order("sort_order");
  return (data ?? []) as Skill[];
}

export async function getServices(homeOnly = false) {
  if (!isSupabaseConfigured) return { items: [] as Service[], media: {} as MediaMap };
  const client = await db();
  let q = client.from("services").select("*").eq("status", "published");
  if (homeOnly) q = q.eq("show_on_home", true);
  const { data } = await q.order("sort_order");
  const items = (data ?? []) as Service[];
  const media = await getMediaMap(items.map((s) => s.image_id).filter(Boolean) as string[]);
  return { items, media };
}

export async function getArticles() {
  if (!isSupabaseConfigured) return { articles: [] as Article[], categories: [] as Category[], media: {} as MediaMap };
  const client = await db();
  const preview = await isPreview();
  let q = client.from("articles").select("*").order("published_at", { ascending: false, nullsFirst: true });
  if (!preview) q = q.eq("status", "published");
  const [{ data }, { data: categories }] = await Promise.all([
    q,
    client.from("categories").select("*").eq("scope", "article").order("sort_order"),
  ]);
  const articles = (data ?? []) as Article[];
  const media = await getMediaMap(articles.map((a) => a.featured_image_id).filter(Boolean) as string[]);
  return { articles, categories: (categories ?? []) as Category[], media };
}

export async function getArticleBySlug(slug: string) {
  if (!isSupabaseConfigured) return null;
  const client = await db();
  const { data } = await client.from("articles").select("*").eq("slug", slug).maybeSingle();
  if (!data) return null;
  const article = data as Article;
  const [{ data: tagRows }, { data: category }] = await Promise.all([
    client.from("article_tags").select("tags(id, name, slug)").eq("article_id", article.id),
    article.category_id ? client.from("categories").select("*").eq("id", article.category_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const tags = ((tagRows ?? []) as unknown as { tags: Tag }[]).map((r) => r.tags).filter(Boolean);
  const media = await getMediaMap([article.featured_image_id].filter(Boolean) as string[]);
  return { article, tags, category: category as Category | null, media };
}

export async function findRedirect(path: string) {
  if (!isSupabaseConfigured) return null;
  const { data } = await publicClient()
    .from("redirects")
    .select("destination, status_code")
    .eq("source", path)
    .eq("enabled", true)
    .maybeSingle();
  return data as { destination: string; status_code: number } | null;
}
