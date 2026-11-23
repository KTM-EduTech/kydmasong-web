"use client";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "@/components/icons";

type S = { id: string; name: string; category: string; description: string | null; url: string | null };

export function SkillsFilter({ skills }: { skills: S[] }) {
  const categories = useMemo(() => [...new Set(skills.map((s) => s.category))], [skills]);
  const [active, setActive] = useState<string>("All");
  const shown = active === "All" ? categories : [active];
  return (
    <div>
      <div role="group" aria-label="Filter skills by category" className="mb-10 flex flex-wrap gap-2">
        {["All", ...categories].map((c) => (
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
      <div className="space-y-14">
        {shown.map((cat) => (
          <section key={cat} aria-labelledby={`skills-${cat}`}>
            <h3 id={`skills-${cat}`} className="h3 mb-5 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" aria-hidden />
              {cat}
            </h3>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {skills
                .filter((s) => s.category === cat)
                .map((s) => (
                  <li key={s.id} className="rounded-2xl border border-line bg-surface p-5 transition hover:border-ink/30">
                    <p className="flex items-center justify-between gap-2 font-semibold">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-underline">
                          {s.name}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        s.name
                      )}
                      {s.url && <ArrowUpRight size={15} className="text-muted" aria-hidden />}
                    </p>
                    {s.description && <p className="mt-1.5 text-[15px] text-muted">{s.description}</p>}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
