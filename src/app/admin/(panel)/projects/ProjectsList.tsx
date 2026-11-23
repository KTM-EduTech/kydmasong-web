"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus, Star } from "@/components/icons";
import clsx from "clsx";
import { reorderFeaturedProjects, reorderProjects } from "@/app/admin/actions/content";
import { SortableList } from "@/components/admin/Sortable";
import { PageHeading, StatusBadge, useToast } from "@/components/admin/ui";

type Row = { id: string; title: string; slug: string; status: string; featured: boolean; featured_order: number; sort_order: number; needs_review: boolean; category_id: string | null; cover_id: string | null };

export function ProjectsList({ projects, categories, thumbs }: { projects: Row[]; categories: { id: string; name: string }[]; thumbs: Record<string, string> }) {
  const toast = useToast();
  const [view, setView] = useState<"all" | "featured">("all");
  const [all, setAll] = useState(projects);
  const [featured, setFeatured] = useState(projects.filter((p) => p.featured).sort((a, b) => a.featured_order - b.featured_order));
  const list = view === "all" ? all : featured;

  return (
    <>
      <PageHeading
        title="Projects"
        description="Your portfolio. Drag to change the order; switch to Featured to order the homepage grid."
        actions={
          <Link href="/admin/projects/new" className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy">
            <Plus size={16} /> New project
          </Link>
        }
      />
      <div className="mb-4 flex gap-2">
        {(["all", "featured"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={clsx("rounded-full px-4 py-2 text-sm font-semibold", view === v ? "bg-navy text-white" : "border border-line bg-surface")}>
            {v === "all" ? `All (${all.length})` : `Featured order (${featured.length})`}
          </button>
        ))}
      </div>
      <SortableList
        items={list}
        onReorder={async (next) => {
          if (view === "all") setAll(next);
          else setFeatured(next);
          const r = view === "all" ? await reorderProjects(next.map((p) => p.id)) : await reorderFeaturedProjects(next.map((p) => p.id));
          if (!r.ok) toast("error", r.error);
        }}
        render={(p, handle) => (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-2 py-2">
            {handle}
            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-navy">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.cover_id && thumbs[p.cover_id] && <img src={thumbs[p.cover_id]} alt="" className="h-full w-full object-cover" />}
            </div>
            <Link href={`/admin/projects/${p.id}`} className="min-w-0 flex-1">
              <span className="block truncate font-semibold hover:underline">{p.title}</span>
              <span className="block text-xs text-muted">{categories.find((c) => c.id === p.category_id)?.name ?? "No category"} · /projects/{p.slug}</span>
            </Link>
            {p.featured && <Star size={16} className="fill-gold text-gold" aria-label="Featured" />}
            {p.needs_review && <StatusBadge status="review" />}
            <StatusBadge status={p.status} />
          </div>
        )}
      />
    </>
  );
}
