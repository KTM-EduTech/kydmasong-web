"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ArrowUpRight, X } from "@/components/icons";

export type HeroFigure = { caption: string; imageUrl: string; imageAlt: string; backgroundUrl: string; url: string };
export type HeroAction = {
  label: string;
  url: string;
  variant: "gold" | "outline";
  modal: { title: string; text: string; button: string } | null;
};

const isExternal = (href: string) => /^https?:\/\//.test(href);
const btnBase =
  "group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold transition duration-300 hover:-translate-y-0.5";
const btnVariant = {
  gold: "bg-gold text-navy hover:shadow-xl hover:shadow-gold/30",
  outline: "border border-line text-ink hover:border-ink",
};

function GoLink({ href, className, children, onClick }: { href: string; className: string; children: React.ReactNode; onClick?: () => void }) {
  const ext = isExternal(href);
  return (
    <Link href={href} className={className} onClick={onClick} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
      {ext ? (
        <ArrowUpRight size={17} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
      ) : (
        <ArrowRight size={17} className="transition group-hover:translate-x-1" aria-hidden />
      )}
      {ext && <span className="sr-only"> (opens in a new tab)</span>}
    </Link>
  );
}

function ActionButton({ action, id }: { action: HeroAction; id: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cls = `${btnBase} ${btnVariant[action.variant]}`;
  if (!action.modal) return <GoLink href={action.url} className={cls}>{action.label}</GoLink>;
  const close = () => dialog.current?.close();
  return (
    <>
      <button type="button" className={cls} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        {action.label}
      </button>
      <dialog
        ref={dialog}
        className="kyd-modal"
        aria-labelledby={`${id}-title`}
        // Clicking the dimmed backdrop (the dialog element itself) closes it.
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="relative px-6 py-10 text-center sm:px-9">
          <button type="button" onClick={close} className="absolute right-3 top-3 rounded-full p-2 text-on-band/70 transition hover:text-on-band" aria-label="Close">
            <X size={22} aria-hidden />
          </button>
          <h3 id={`${id}-title`} className="font-display text-3xl tracking-wide">{action.modal.title}</h3>
          {action.modal.text && <p className="mx-auto mt-3 max-w-sm text-on-band/80">{action.modal.text}</p>}
          <div className="mt-8">
            <GoLink href={action.url} className={`${btnBase} ${btnVariant.gold}`} onClick={close}>
              {action.modal.button || action.label}
            </GoLink>
          </div>
        </div>
      </dialog>
    </>
  );
}

function Figure({ f, index }: { f: HeroFigure; index: number }) {
  const inner = (
    <figure className="kyd-figure" style={{ animationDelay: `${200 + index * 160}ms` }}>
      {f.backgroundUrl && <span className="kyd-figure-bg" style={{ backgroundImage: `url("${f.backgroundUrl}")` }} aria-hidden />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={f.imageUrl} alt={f.imageAlt} loading="eager" decoding="async" />
      {f.caption && <figcaption aria-hidden={!!f.url}>{f.caption}</figcaption>}
    </figure>
  );
  if (!f.url) return <div className="kyd-figure-link">{inner}</div>;
  const ext = isExternal(f.url);
  return (
    <Link
      href={f.url}
      className="kyd-figure-link"
      aria-label={ext ? `${f.caption} (opens in a new tab)` : f.caption}
      {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {inner}
    </Link>
  );
}

/** Heading with an optional highlighted phrase (must match part of the heading exactly). */
export function HighlightedHeading({ as: Tag, className, heading, highlight }: { as: "h1" | "h2"; className: string; heading: string; highlight: string }) {
  const at = highlight ? heading.indexOf(highlight) : -1;
  return (
    <Tag className={className}>
      {at >= 0 ? (
        <>
          {heading.slice(0, at)}
          <span className="kyd-hl">{highlight}</span>
          {heading.slice(at + highlight.length)}
        </>
      ) : (
        heading
      )}
    </Tag>
  );
}

/** Hero buttons; each may open a pop-up before following its link. */
export function HeroActions({ actions, id, className }: { actions: HeroAction[]; id: string; className: string }) {
  if (!actions.length) return null;
  return (
    <div className={className}>
      {actions.map((a, i) => (
        <ActionButton key={i} action={a} id={`${id}-m${i}`} />
      ))}
    </div>
  );
}

export function HeroFigures({
  id,
  eyebrow,
  heading,
  highlight,
  intro,
  actions,
  figures,
  asH1,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  highlight: string;
  intro: string;
  actions: HeroAction[];
  figures: HeroFigure[];
  asH1: boolean;
}) {
  return (
    <section className="kyd-hero relative overflow-x-clip">
      {/* Same background as the standard hero: dotted grid + gold glow. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" />
        <div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-gold/30 blur-3xl" />
      </div>
      <div className="container-site relative grid items-center gap-12 pb-24 pt-10 text-center lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-10 lg:text-left">
        <div className="kyd-hero-content relative z-10">
          {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
          <HighlightedHeading as={asH1 ? "h1" : "h2"} className="kyd-hero-title" heading={heading} highlight={highlight} />
          {intro && <p className="mx-auto mt-6 max-w-xl text-lg text-muted md:text-xl lg:mx-0">{intro}</p>}
          <HeroActions actions={actions} id={id} className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start" />
        </div>
        {figures.length > 0 && (
          <div className="kyd-figures">
            {figures.map((f, i) => (
              <Figure key={i} f={f} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
