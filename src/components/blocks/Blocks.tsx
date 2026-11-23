import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail, MapPin, Navigation, Plus, Quote } from "@/components/icons";
import type { Section } from "@/lib/types";
import { mediaUrl, type MediaMap } from "@/lib/media";
import { plainToHtml, renderRichText } from "@/lib/richtext/render";
import { toEmbedUrl } from "@/lib/sections";
import { getExperiences, getProjects, getServices, getSettings, getSkills } from "@/lib/data";
import { Reveal } from "@/components/site/Reveal";
import { MediaImage } from "./MediaImage";
import { ImageCompare } from "./ImageCompare";
import { SkillsFilter } from "./SkillsFilter";
import { ProjectsFilter } from "./ProjectsFilter";
import { ContactForm } from "./ContactForm";
import { HeroActions, HeroFigures, HighlightedHeading, type HeroAction, type HeroFigure } from "./HeroFigures";

type D = Record<string, unknown>;
const str = (d: D, k: string) => (typeof d[k] === "string" ? (d[k] as string).trim() : "");
const arr = <T,>(d: D, k: string) => (Array.isArray(d[k]) ? (d[k] as T[]) : []);
const isExternal = (href: string) => /^https?:\/\//.test(href);

function Btn({ href, label, variant = "gold" }: { href: string; label: string; variant?: "gold" | "outline" | "navy" }) {
  if (!href || !label) return null;
  const ext = isExternal(href);
  const cls = {
    gold: "bg-gold text-navy hover:shadow-xl hover:shadow-gold/30",
    navy: "bg-navy text-white hover:shadow-xl hover:shadow-navy/30",
    outline: "border border-line text-ink hover:border-ink",
  }[variant];
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold transition duration-300 hover:-translate-y-0.5 ${cls}`}
      {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {label}
      {ext ? (
        <ArrowUpRight size={17} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      ) : (
        <ArrowRight size={17} className="transition group-hover:translate-x-1" aria-hidden />
      )}
      {ext && <span className="sr-only"> (opens in a new tab)</span>}
    </Link>
  );
}

function SectionHead({ d, center = false }: { d: D; center?: boolean }) {
  const eyebrow = str(d, "eyebrow");
  const heading = str(d, "heading");
  const intro = str(d, "intro");
  if (!eyebrow && !heading && !intro) return null;
  return (
    <Reveal className={`mb-12 max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      {heading && <h2 className="h2">{heading}</h2>}
      {intro && <p className="mt-5 text-lg text-muted">{intro}</p>}
    </Reveal>
  );
}

/* ---------------------------------------------------------------- Hero */
const safeHref = (u: string) => (/^(https?:\/\/|\/|#|mailto:)/.test(u) ? u : "");
const safeImg = (u: string) => (/^https:\/\//.test(u) ? u : "");

function heroAction(d: D, key: "primary" | "secondary"): HeroAction | null {
  const label = str(d, `${key}_label`);
  const url = safeHref(str(d, `${key}_url`));
  if (!label || !url) return null;
  const title = str(d, `${key}_modal_title`);
  return {
    label,
    url,
    variant: key === "primary" ? "gold" : "outline",
    modal: title ? { title, text: str(d, `${key}_modal_text`), button: str(d, `${key}_modal_button`) } : null,
  };
}

/** A media-library image (preferred) or, for content saved before 23 Nov 2026, a legacy https URL. */
function heroImage(f: D, key: "image" | "background", media: MediaMap) {
  const m = media[str(f, `${key}_id`)];
  // Cards are ~220px wide (portrait scales up on hover); 600px covers 2x screens.
  const width = key === "image" ? 600 : 480;
  if (m) return { url: imageKitWidth(mediaUrl(m), width), alt: m.alt };
  return { url: imageKitWidth(safeImg(str(f, `${key}_url`)), width), alt: "" };
}

/** Ask ImageKit for a resized copy (keeps format and transparency). Other hosts are left as they are. */
function imageKitWidth(url: string, width: number) {
  if (!url.startsWith("https://ik.imagekit.io/")) return url;
  try {
    const u = new URL(url);
    if (u.searchParams.has("tr")) return url; // already transformed by the editor
    u.searchParams.set("tr", `w-${width}`);
    return u.toString();
  } catch {
    return url;
  }
}

function Hero({ id, d, media, first }: { id: string; d: D; media: MediaMap; first: boolean }) {
  const actions = [heroAction(d, "primary"), heroAction(d, "secondary")].filter(Boolean) as HeroAction[];
  const heroId = `hero-${id.slice(0, 8)}`;
  if (d.layout === "figures") {
    const figures: HeroFigure[] = arr<D>(d, "figures")
      .map((f) => {
        const img = heroImage(f, "image", media);
        const caption = str(f, "caption");
        return {
          caption,
          imageUrl: img.url,
          imageAlt: img.alt || caption,
          backgroundUrl: heroImage(f, "background", media).url,
          url: safeHref(str(f, "url")),
        };
      })
      .filter((f) => f.imageUrl);
    return (
      <HeroFigures
        id={heroId}
        eyebrow={str(d, "eyebrow")}
        heading={str(d, "heading")}
        highlight={str(d, "heading_highlight")}
        intro={str(d, "intro")}
        actions={actions}
        figures={figures}
        asH1={first}
      />
    );
  }
  const before = media[str(d, "before_id")];
  const after = media[str(d, "after_id")];
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" aria-hidden />
      <div
        className="hero-glow pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-gold/30 blur-3xl"
        aria-hidden
      />
      <div className="container-site relative grid items-center gap-14 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
        <div>
          {str(d, "eyebrow") && <p className="eyebrow mb-6">{str(d, "eyebrow")}</p>}
          <HighlightedHeading as={first ? "h1" : "h2"} className="display" heading={str(d, "heading")} highlight={str(d, "heading_highlight")} />
          {str(d, "intro") && <p className="mt-7 max-w-xl text-lg text-muted md:text-xl">{str(d, "intro")}</p>}
          <HeroActions actions={actions} id={heroId} className="mt-10 flex flex-wrap gap-3" />
        </div>
        {before && after ? (
          <ImageCompare
            beforeSrc={mediaUrl(before)}
            afterSrc={mediaUrl(after)}
            beforeAlt={before.alt}
            afterAlt={after.alt}
            beforeLabel={str(d, "before_label")}
            afterLabel={str(d, "after_label")}
          />
        ) : before || after ? (
          <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-navy">
            <MediaImage id={(before ?? after)!.id} media={media} fill priority sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Page header */
function PageHeader({ d, media, first }: { d: D; media: MediaMap; first: boolean }) {
  const Heading = first ? "h1" : "h2";
  const img = str(d, "image_id");
  const tags = arr<string>(d, "tags").filter(Boolean);
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className={`container-site relative grid items-center gap-12 pb-16 pt-12 md:pb-20 md:pt-16 ${img ? "lg:grid-cols-[1.3fr_0.7fr]" : ""}`}>
        <div className="max-w-3xl">
          {str(d, "eyebrow") && <p className="eyebrow mb-5">{str(d, "eyebrow")}</p>}
          <Heading className="display !text-[clamp(2.25rem,5vw,3.75rem)]">{str(d, "heading")}</Heading>
          {str(d, "intro") && <p className="mt-6 text-lg text-muted md:text-xl">{str(d, "intro")}</p>}
          {tags.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2">
              {tags.map((t) => (
                <li key={t} className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
        {img && media[img] && (
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] bg-navy">
            <MediaImage id={img} media={media} fill priority sizes="(min-width: 1024px) 30vw, 80vw" />
          </div>
        )}
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Intro split */
function IntroSplit({ d, media }: { d: D; media: MediaMap }) {
  const img = str(d, "image_id");
  const html = renderRichText(d.body);
  const focus = arr<string>(d, "focus_areas").filter(Boolean);
  return (
    <section className="py-20 md:py-28">
      <div className="container-site grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="relative order-2 lg:order-1">
          <div className="absolute -left-6 -top-6 h-full w-full rounded-[2rem] bg-navy" aria-hidden />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-bg-alt">
            {img && <MediaImage id={img} media={media} fill sizes="(min-width: 1024px) 45vw, 100vw" />}
          </div>
        </Reveal>
        <Reveal className="order-1 lg:order-2" delay={120}>
          {str(d, "eyebrow") && <p className="eyebrow mb-5">{str(d, "eyebrow")}</p>}
          {str(d, "heading") && <h2 className="h2 mb-6">{str(d, "heading")}</h2>}
          {html && <div className="rt text-lg" dangerouslySetInnerHTML={{ __html: html }} />}
          {focus.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Focus areas">
              {focus.map((f) => (
                <li key={f} className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-navy">
                  {f}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-9">
            <Btn href={str(d, "link_url")} label={str(d, "link_label")} variant="navy" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Rich text */
function RichTextBlock({ d }: { d: D }) {
  const html = renderRichText(d.body);
  const wide = d.width === "wide";
  return (
    <section className="py-14 md:py-20">
      <div className={`container-site ${wide ? "" : "max-w-3xl"}`}>
        {str(d, "heading") && (
          <Reveal>
            <h2 className="h2 mb-8">{str(d, "heading")}</h2>
          </Reveal>
        )}
        {html && <div className="rt text-[17px]" dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Marquee */
function Marquee({ d }: { d: D }) {
  const items = arr<string>(d, "items").filter(Boolean);
  if (!items.length) return null;
  return (
    <section className="border-y border-line bg-surface py-8" aria-label={str(d, "heading") || "Toolkit"}>
      {str(d, "heading") && <h2 className="eyebrow container-site mb-5">{str(d, "heading")}</h2>}
      <div className="marquee relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]" tabIndex={0}>
        <ul className="sr-only">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        <div className="marquee-track flex w-max gap-4" aria-hidden>
          {[...items, ...items].map((i, idx) => (
            <span key={idx} className="flex items-center gap-4 whitespace-nowrap text-2xl font-semibold text-ink md:text-3xl">
              {i}
              <span className="h-2.5 w-2.5 rounded-full bg-gold" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Timeline */
type TItem = { year?: string; title?: string; body?: string; link_label?: string; link_url?: string };
function Timeline({ d }: { d: D }) {
  const items = arr<TItem>(d, "items");
  return (
    <section className="overflow-hidden py-20 md:py-28">
      <div className="container-site">
        <SectionHead d={d} />
        <ol className="relative space-y-10 border-l-2 border-line pl-8 lg:flex lg:snap-x lg:snap-mandatory lg:gap-6 lg:space-y-0 lg:overflow-x-auto lg:border-l-0 lg:border-t-2 lg:pb-6 lg:pl-0 lg:pt-10">
          {items.map((it, i) => (
            <Reveal as="li" key={i} delay={i * 80} className="relative lg:w-[22rem] lg:shrink-0 lg:snap-start">
              <span
                className="absolute -left-[41px] top-1.5 h-4 w-4 rounded-full border-4 border-bg bg-gold lg:-top-[49px] lg:left-0"
                aria-hidden
              />
              {it.year && <p className="text-4xl font-semibold tracking-tight text-ink/90">{it.year}</p>}
              {it.title && <h3 className="h3 mt-3">{it.title}</h3>}
              {it.body && <div className="mt-3 space-y-3 text-muted" dangerouslySetInnerHTML={{ __html: plainToHtml(it.body) }} />}
              {it.link_url && it.link_label && (
                <a href={it.link_url} target="_blank" rel="noopener noreferrer" className="link-underline mt-3 inline-flex items-center gap-1 font-medium">
                  {it.link_label} <ArrowUpRight size={15} aria-hidden />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------------------------------- Featured projects */
async function FeaturedProjects({ d }: { d: D }) {
  const limit = typeof d.limit === "number" ? d.limit : 6;
  const { projects, media } = await getProjects({ featuredOnly: true, limit });
  if (!projects.length) return null;
  const spans = ["md:col-span-4 md:row-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-3", "md:col-span-3", "md:col-span-2"];
  return (
    <section className="py-20 md:py-28">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead d={d} />
          <div className="mb-12">
            <Btn href={str(d, "link_url")} label={str(d, "link_label")} variant="outline" />
          </div>
        </div>
        <ul className="grid auto-rows-[minmax(15rem,auto)] gap-5 md:grid-cols-6">
          {projects.map((p, i) => (
            <Reveal as="li" key={p.id} delay={i * 70} className={spans[i % spans.length]}>
              <Link
                href={`/projects/${p.slug}`}
                className="group relative flex h-full min-h-[15rem] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-navy p-7 text-white"
              >
                {p.cover_id && (
                  <MediaImage
                    id={p.cover_id}
                    media={media}
                    fill
                    sizes="(min-width: 768px) 60vw, 100vw"
                    className="opacity-60 transition duration-700 group-hover:scale-105 group-hover:opacity-40"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" aria-hidden />
                <div className="relative">
                  <h3 className="text-xl font-semibold md:text-2xl">{p.title}</h3>
                  {p.summary && <p className="mt-2 line-clamp-2 max-w-lg text-white/80">{p.summary}</p>}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
                    View project <ArrowRight size={15} className="transition group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- All projects */
async function ProjectsGrid({ d }: { d: D }) {
  const { projects, categories, media } = await getProjects();
  const cards = projects.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    category: categories.find((c) => c.id === p.category_id)?.name ?? null,
    cover: p.cover_id && media[p.cover_id] ? { src: mediaUrl(media[p.cover_id]), alt: media[p.cover_id].alt } : null,
  }));
  return (
    <section className="py-16 md:py-24">
      <div className="container-site">
        {str(d, "heading") && <h2 className="h2 mb-10">{str(d, "heading")}</h2>}
        <ProjectsFilter projects={cards} categories={categories.map((c) => c.name)} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Services */
async function ServicesList({ d }: { d: D }) {
  const { items, media } = await getServices(Boolean(d.home_only));
  if (!items.length) return null;
  const details = d.show_details !== false;
  return (
    <section className="py-20 md:py-28">
      <div className="container-site">
        <SectionHead d={d} />
        <ol className="border-t border-line">
          {items.map((s, i) => (
            <Reveal as="li" key={s.id} className="border-b border-line">
              <details className="group py-8 [&_summary::-webkit-details-marker]:hidden" open={false}>
                <summary className="flex cursor-pointer list-none items-start gap-6 md:items-center">
                  <span className="w-12 shrink-0 pt-1 text-sm font-semibold text-muted md:pt-0">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">
                    <span className="block text-2xl font-semibold tracking-tight transition group-hover:translate-x-1 md:text-4xl">{s.title}</span>
                    {s.summary && <span className="mt-2 block max-w-2xl text-muted">{s.summary}</span>}
                  </span>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line transition group-open:rotate-45 group-open:bg-gold group-open:text-navy group-hover:border-ink">
                    <Plus size={15} />
                  </span>
                </summary>
                <div className="grid gap-8 pt-8 md:ml-[4.5rem] md:grid-cols-[1fr_18rem]">
                  <div>
                    {details && s.details && <div className="space-y-3 text-muted" dangerouslySetInnerHTML={{ __html: plainToHtml(s.details) }} />}
                    {s.cta_label && s.cta_url && (
                      <div className="mt-6">
                        <Btn href={s.cta_url} label={s.cta_label} variant="navy" />
                      </div>
                    )}
                  </div>
                  {s.image_id && media[s.image_id] && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-bg-alt">
                      <MediaImage id={s.image_id} media={media} fill sizes="18rem" />
                    </div>
                  )}
                </div>
              </details>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Skills */
async function Skills({ d }: { d: D }) {
  const skills = await getSkills();
  if (!skills.length) return null;
  return (
    <section className="py-16 md:py-24">
      <div className="container-site">
        <SectionHead d={d} />
        <SkillsFilter skills={skills.map((s) => ({ id: s.id, name: s.name, category: s.category, description: s.description, url: s.url }))} />
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Experience */
async function ExperienceBlock({ d }: { d: D }) {
  const { items, media } = await getExperiences();
  if (!items.length) return null;
  return (
    <section className="py-16 md:py-24">
      <div className="container-site">
        {str(d, "heading") && <h2 className="h2 mb-12">{str(d, "heading")}</h2>}
        <ol className="space-y-6">
          {items.map((e, i) => (
            <Reveal as="li" key={e.id} delay={Math.min(i, 4) * 60}>
              <article className="grid gap-6 rounded-[1.75rem] border border-line bg-surface p-7 transition hover:border-ink/30 hover:shadow-xl hover:shadow-navy/5 md:grid-cols-[13rem_1fr] md:p-9">
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-muted">
                    {[e.start_label, e.end_label].filter(Boolean).join(" – ")}
                  </p>
                  {e.logo_id && media[e.logo_id] && (
                    <div className="flex h-16 w-32 items-center rounded-xl bg-white p-2">
                      <MediaImage id={e.logo_id} media={media} className="max-h-12 w-auto object-contain" sizes="8rem" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold md:text-2xl">{e.role}</h3>
                  <p className="mt-1 text-muted">
                    {e.organization_url ? (
                      <a href={e.organization_url} target="_blank" rel="noopener noreferrer" className="link-underline font-medium text-ink">
                        {e.organization}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      <span className="font-medium text-ink">{e.organization}</span>
                    )}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                  {e.summary && <p className="mt-4 text-muted">{e.summary}</p>}
                  {e.bullets.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {e.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-3">
                          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {e.links.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {e.links.map((l) => (
                        <li key={l.url}>
                          <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium transition hover:border-gold hover:bg-gold hover:text-navy">
                            {l.label} <ArrowUpRight size={13} aria-hidden />
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Cards */
type CItem = { kicker?: string; title?: string; body?: string };
function Cards({ d }: { d: D }) {
  const items = arr<CItem>(d, "items");
  return (
    <section className="py-16 md:py-24">
      <div className="container-site">
        <SectionHead d={d} />
        <ul className="grid gap-px overflow-hidden rounded-[1.75rem] border border-line bg-line md:grid-cols-3">
          {items.map((c, i) => (
            <Reveal as="li" key={i} delay={i * 80} className="bg-surface p-8">
              {c.kicker && <p className="text-sm font-semibold text-muted">{c.kicker}</p>}
              {c.title && <h3 className="h3 mt-3">{c.title}</h3>}
              {c.body && <div className="mt-3 space-y-3 text-muted" dangerouslySetInnerHTML={{ __html: plainToHtml(c.body) }} />}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Quote */
function PullQuote({ d }: { d: D }) {
  if (!str(d, "text")) return null;
  return (
    <section className="py-20 md:py-28">
      <Reveal className="container-site max-w-4xl">
        <figure>
          <Quote size={44} className="text-gold" />
          <blockquote className="mt-6 text-2xl font-medium leading-snug tracking-tight md:text-4xl">{str(d, "text")}</blockquote>
          {str(d, "attribution") && <figcaption className="mt-6 font-medium text-muted">— {str(d, "attribution")}</figcaption>}
        </figure>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- Stats */
function Stats({ d }: { d: D }) {
  const items = arr<{ value?: string; label?: string }>(d, "items").filter((i) => i.value && i.label);
  if (!items.length) return null;
  return (
    <section className="bg-band py-20 text-on-band">
      <div className="container-site">
        {str(d, "heading") && <h2 className="h2 mb-12">{str(d, "heading")}</h2>}
        <dl className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s, i) => (
            <div key={i}>
              <dt className="text-on-band/70">{s.label}</dt>
              <dd className="mt-2 font-display text-5xl tracking-wide text-gold">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Testimonials */
function Testimonials({ d }: { d: D }) {
  // Only quotes explicitly marked as having permission are ever shown.
  const items = arr<{ quote?: string; name?: string; role?: string; permission?: boolean }>(d, "items").filter(
    (t) => t.permission === true && t.quote && t.name,
  );
  if (!items.length) return null;
  return (
    <section className="py-20 md:py-28">
      <div className="container-site">
        {str(d, "heading") && <h2 className="h2 mb-12">{str(d, "heading")}</h2>}
        <ul className="grid gap-6 md:grid-cols-2">
          {items.map((t, i) => (
            <Reveal as="li" key={i} className="rounded-[1.75rem] border border-line bg-surface p-8">
              <blockquote className="text-lg">“{t.quote}”</blockquote>
              <p className="mt-5 font-semibold">{t.name}</p>
              {t.role && <p className="text-sm text-muted">{t.role}</p>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ CTA */
function Cta({ d }: { d: D }) {
  const navy = d.tone === "navy";
  return (
    <section className="py-16 md:py-24">
      <Reveal className="container-site">
        <div className={`relative overflow-hidden rounded-[2.25rem] px-8 py-14 md:px-16 md:py-20 ${navy ? "bg-navy text-white" : "bg-gold text-navy"}`}>
          <div className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full ${navy ? "bg-gold/20" : "bg-white/40"} blur-2xl`} aria-hidden />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              {str(d, "heading") && <h2 className="h2">{str(d, "heading")}</h2>}
              {str(d, "body") && <p className={`mt-4 text-lg ${navy ? "text-white/80" : "text-navy/80"}`}>{str(d, "body")}</p>}
            </div>
            <Btn href={str(d, "button_url")} label={str(d, "button_label")} variant={navy ? "gold" : "navy"} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------------------------------- Contact form */
async function ContactBlock({ d }: { d: D }) {
  const s = await getSettings();
  return (
    <section className="py-16 md:py-24">
      <div className="container-site grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          {str(d, "heading") && <h2 className="h2">{str(d, "heading")}</h2>}
          {str(d, "intro") && <p className="mt-5 text-lg text-muted">{str(d, "intro")}</p>}
          <ul className="mt-8 space-y-3">
            {s.email && (
              <li className="flex gap-3">
                <Mail className="mt-1 shrink-0" size={19} aria-hidden />
                <a href={`mailto:${s.email}`} className="link-underline font-medium">
                  {s.email}
                </a>
              </li>
            )}
            {s.primary_location_label && (
              <li className="flex gap-3">
                <MapPin className="mt-1 shrink-0" size={19} aria-hidden />
                <span>Based in {s.primary_location_label}</span>
              </li>
            )}
            {s.current_location_label && (
              <li className="flex gap-3">
                <Navigation className="mt-1 shrink-0" size={19} aria-hidden />
                <span>Currently in {s.current_location_label}</span>
              </li>
            )}
          </ul>
          {s.availability && <p className="mt-6 inline-block rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy">{s.availability}</p>}
        </div>
        <ContactForm
          enquiryTypes={s.enquiry_types}
          privacyUrl={s.privacy_policy_url}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Location */
async function Location({ d }: { d: D }) {
  const s = await getSettings();
  const showMap = d.show_map !== false && s.primary_location_lat !== null && s.primary_location_lng !== null;
  const mapsLink = s.map_query ? `https://maps.google.com/?q=${encodeURIComponent(s.map_query)}` : "";
  return (
    <section className="py-16 md:py-24">
      <div className="container-site grid items-stretch gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="flex flex-col justify-between rounded-[1.75rem] bg-navy p-8 text-white md:p-10">
          <div>
            {str(d, "heading") && <h2 className="h2">{str(d, "heading")}</h2>}
            <dl className="mt-8 space-y-5">
              {s.primary_location_label && (
                <div>
                  <dt className="text-sm uppercase tracking-[0.14em] text-white/60">Based in</dt>
                  <dd className="mt-1 text-xl font-semibold">{s.primary_location_label}</dd>
                </div>
              )}
              {s.current_location_label && (
                <div>
                  <dt className="text-sm uppercase tracking-[0.14em] text-white/60">Currently in</dt>
                  <dd className="mt-1 text-xl font-semibold">{s.current_location_label}</dd>
                </div>
              )}
              {s.availability && (
                <div>
                  <dt className="text-sm uppercase tracking-[0.14em] text-white/60">Availability</dt>
                  <dd className="mt-1 text-lg text-gold">{s.availability}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {s.email && <Btn href={`mailto:${s.email}`} label="Email me" />}
            {mapsLink && <Btn href={mapsLink} label="Open in Maps" variant="outline" />}
          </div>
        </Reveal>
        {showMap && (
          <Reveal className="min-h-[22rem] overflow-hidden rounded-[1.75rem] border border-line" delay={100}>
            <iframe
              title={`Map showing ${s.primary_location_label}`}
              src={`https://www.google.com/maps?q=${s.primary_location_lat},${s.primary_location_lng}&z=12&output=embed`}
              className="h-full min-h-[22rem] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Embed */
function Embed({ d }: { d: D }) {
  const src = toEmbedUrl(str(d, "url"));
  const height = typeof d.height === "number" ? d.height : 720;
  return (
    <section className="py-16 md:py-24">
      <div className="container-site">
        <SectionHead d={d} />
        {src ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface">
            <iframe
              src={src}
              title={str(d, "title") || "Embedded content"}
              className="w-full"
              style={{ height }}
              loading="lazy"
              allow="fullscreen; encrypted-media"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <p className="text-muted">This embed is not available.</p>
        )}
        {src && d.show_link !== false && (
          <a href={str(d, "url")} target="_blank" rel="noopener noreferrer" className="link-underline mt-5 inline-flex items-center gap-1 font-medium">
            Open in a new tab <ArrowUpRight size={15} aria-hidden />
          </a>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Link groups */
type LGroup = { title?: string; links?: { label?: string; url?: string; description?: string }[] };
function LinkGroups({ d }: { d: D }) {
  const groups = arr<LGroup>(d, "groups");
  return (
    <section className="py-16 md:py-24">
      <div className="container-site">
        <SectionHead d={d} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, gi) => (
            <Reveal key={gi} delay={gi * 80} className="rounded-[1.75rem] border border-line bg-surface p-7">
              {g.title && <h2 className="h3 mb-5">{g.title}</h2>}
              <ul className="divide-y divide-line">
                {(g.links ?? []).filter((l) => l.url && l.label).map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      {...(isExternal(l.url!) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="group flex items-start justify-between gap-4 py-3.5"
                    >
                      <span>
                        <span className="block font-medium group-hover:underline group-hover:decoration-gold group-hover:decoration-[3px] group-hover:underline-offset-4">
                          {l.label}
                        </span>
                        {l.description && <span className="mt-0.5 block text-sm text-muted">{l.description}</span>}
                      </span>
                      <ArrowUpRight size={17} className="mt-1 shrink-0 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                      {isExternal(l.url!) && <span className="sr-only"> (opens in a new tab)</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Image */
function ImageBlock({ d, media }: { d: D; media: MediaMap }) {
  const id = str(d, "media_id");
  if (!id || !media[id]) return null;
  return (
    <section className="py-10 md:py-14">
      <figure className={`container-site ${d.size === "narrow" ? "max-w-3xl" : ""}`}>
        <MediaImage id={id} media={media} className="h-auto w-full rounded-[1.75rem]" sizes="(min-width: 1200px) 1200px, 100vw" />
        {str(d, "caption") && <figcaption className="mt-3 text-sm text-muted">{str(d, "caption")}</figcaption>}
      </figure>
    </section>
  );
}

/* ------------------------------------------------------------- Renderer */
export function SectionRenderer({ sections, media }: { sections: Section[]; media: MediaMap }) {
  return (
    <>
      {sections.map((s, i) => {
        const d = (s.data ?? {}) as D;
        const first = i === 0;
        switch (s.type) {
          case "hero": return <Hero key={s.id} id={s.id} d={d} media={media} first={first} />;
          case "page_header": return <PageHeader key={s.id} d={d} media={media} first={first} />;
          case "intro_split": return <IntroSplit key={s.id} d={d} media={media} />;
          case "rich_text": return <RichTextBlock key={s.id} d={d} />;
          case "marquee": return <Marquee key={s.id} d={d} />;
          case "timeline": return <Timeline key={s.id} d={d} />;
          case "featured_projects": return <FeaturedProjects key={s.id} d={d} />;
          case "projects_grid": return <ProjectsGrid key={s.id} d={d} />;
          case "services_list": return <ServicesList key={s.id} d={d} />;
          case "skills": return <Skills key={s.id} d={d} />;
          case "experience": return <ExperienceBlock key={s.id} d={d} />;
          case "cards": return <Cards key={s.id} d={d} />;
          case "quote": return <PullQuote key={s.id} d={d} />;
          case "stats": return <Stats key={s.id} d={d} />;
          case "testimonials": return <Testimonials key={s.id} d={d} />;
          case "cta": return <Cta key={s.id} d={d} />;
          case "contact_form": return <ContactBlock key={s.id} d={d} />;
          case "location": return <Location key={s.id} d={d} />;
          case "embed": return <Embed key={s.id} d={d} />;
          case "link_groups": return <LinkGroups key={s.id} d={d} />;
          case "image": return <ImageBlock key={s.id} d={d} media={media} />;
          default: return null;
        }
      })}
    </>
  );
}
