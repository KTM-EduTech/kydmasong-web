"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

type Card = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category: string | null;
  cover: { src: string; alt: string } | null;
};

export function ProjectsFilter({ projects, categories }: { projects: Card[]; categories: string[] }) {
  const [active, setActive] = useState("All");
  const used = categories.filter((c) => projects.some((p) => p.category === c));
  const list = active === "All" ? projects : projects.filter((p) => p.category === active);
  return (
    <div>
      {used.length > 1 && (
        <div role="group" aria-label="Filter projects by category" className="mb-10 flex flex-wrap gap-2">
          {["All", ...used].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={active === c}
              onClick={() => setActive(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active === c ? "bg-navy text-white [[data-theme=dark]_&]:bg-gold [[data-theme=dark]_&]:text-navy" : "border border-line hover:border-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {list.map((p) => (
          <li key={p.id}>
            <Link href={`/projects/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-surface transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-navy/10">
              <div className="relative aspect-[16/10] overflow-hidden bg-navy">
                {p.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover.src} alt={p.cover.alt} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                {p.category && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{p.category}</p>}
                <h3 className="mt-2 text-xl font-semibold">{p.title}</h3>
                {p.summary && <p className="mt-2 line-clamp-3 text-[15px] text-muted">{p.summary}</p>}
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold">
                  View project <ArrowRight size={15} className="transition group-hover:translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
