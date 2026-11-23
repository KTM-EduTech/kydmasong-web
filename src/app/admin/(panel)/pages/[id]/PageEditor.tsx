"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Copy, Eye, EyeOff, Flag, Plus, Save, Trash2 } from "@/components/icons";
import clsx from "clsx";
import { savePage } from "@/app/admin/actions/pages";
import { SECTION_BY_TYPE, SECTION_DEFS } from "@/lib/sections";
import type { Page, Section } from "@/lib/types";
import { AutoForm } from "@/components/admin/AutoForm";
import { MediaField } from "@/components/admin/MediaPicker";
import { SortableList } from "@/components/admin/Sortable";
import { Button, Card, Modal, Select, StatusBadge, TextArea, TextInput, Toggle, useConfirm, useToast, useUnsavedWarning } from "@/components/admin/ui";

type EditSection = Omit<Section, "page_id" | "position"> & { key: string };
const newKey = () => Math.random().toString(36).slice(2);

export function PageEditor({ page, sections, mediaUrls: initialUrls }: { page: Page; sections: Section[]; mediaUrls: Record<string, string> }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<"content" | "settings">("content");
  const [p, setP] = useState(page);
  const [items, setItems] = useState<EditSection[]>(sections.map((s) => ({ ...s, key: s.id })));
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [mediaUrls] = useState(initialUrls);
  useUnsavedWarning(dirty);

  const upd = <K extends keyof Page>(k: K, v: Page[K]) => {
    setP((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };
  const updSection = (key: string, patch: Partial<EditSection>) => {
    setItems((xs) => xs.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    setDirty(true);
  };

  const save = async (statusOverride?: "draft" | "published") => {
    setSaving(true);
    const status = statusOverride ?? p.status;
    const r = await savePage(
      p.id,
      {
        title: p.title,
        slug: p.slug,
        status,
        show_in_sitemap: p.show_in_sitemap,
        needs_review: p.needs_review,
        review_note: p.review_note,
        seo_title: p.seo_title,
        seo_description: p.seo_description,
        og_image_id: p.og_image_id,
        canonical_url: p.canonical_url,
        noindex: p.noindex,
        sort_order: p.sort_order,
      },
      items.map((s) => ({
        id: s.id && !s.id.startsWith("new-") ? s.id : undefined,
        client_key: s.id && !s.id.startsWith("new-") ? undefined : s.key,
        type: s.type,
        label: s.label,
        data: s.data,
        visible: s.visible,
        needs_review: s.needs_review,
        review_note: s.review_note,
      })),
    );
    setSaving(false);
    if (!r.ok) return toast("error", r.error);
    const newIds = r.data?.ids ?? {};
    setItems((xs) => xs.map((s) => (newIds[s.key] ? { ...s, id: newIds[s.key] } : s)));
    setP((x) => ({ ...x, status }));
    setDirty(false);
    toast("ok", statusOverride === "published" ? "Saved and published" : statusOverride === "draft" ? "Saved as draft (unpublished)" : "Saved");
    router.refresh();
  };

  const path = p.slug === "home" ? "/" : `/${p.slug}`;
  const sectionTitle = (s: EditSection) => {
    const d = s.data as Record<string, unknown>;
    const h = (d.heading as string) || (d.text as string) || "";
    return s.label || h || SECTION_BY_TYPE[s.type]?.name || s.type;
  };

  const sortedDefs = useMemo(() => [...SECTION_DEFS].sort((a, b) => a.name.localeCompare(b.name)), []);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/admin/pages" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft size={16} /> Pages
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{p.title || "Untitled"}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <StatusBadge status={p.status} /> {path} {dirty && <span className="font-semibold text-orange-700">· Unsaved changes</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/preview?path=${encodeURIComponent(path)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (dirty) {
                e.preventDefault();
                toast("error", "Save your changes first, then preview.");
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-ink/40"
          >
            <Eye size={16} /> Preview
          </a>
          {p.status === "published" ? (
            <Button variant="secondary" onClick={() => save("draft")} disabled={saving || p.slug === "home"}>
              Unpublish
            </Button>
          ) : (
            <Button variant="gold" onClick={() => save("published")} disabled={saving}>
              Save &amp; publish
            </Button>
          )}
          <Button onClick={() => save()} disabled={saving}>
            <Save size={16} /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div role="tablist" className="mb-5 flex gap-1 border-b border-line">
        {(["content", "settings"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={clsx("-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold", tab === t ? "border-navy text-ink" : "border-transparent text-muted hover:text-ink")}
          >
            {t === "content" ? `Sections (${items.length})` : "Page settings & SEO"}
          </button>
        ))}
      </div>

      {tab === "content" ? (
        <div className="space-y-4">
          {items.length === 0 && <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">This page has no sections yet.</p>}
          <SortableList
            items={items.map((s) => ({ ...s, id: s.key }))}
            onReorder={(next) => {
              setItems(next.map((n) => ({ ...n, id: items.find((i) => i.key === n.key)!.id })) as EditSection[]);
              setDirty(true);
            }}
            render={(s, handle) => {
              const def = SECTION_BY_TYPE[s.type];
              const isOpen = open === s.key;
              return (
                <div className={clsx("rounded-xl border bg-surface", s.visible ? "border-line" : "border-dashed border-line opacity-75")}>
                  <div className="flex items-center gap-2 px-2 py-2">
                    {handle}
                    <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setOpen(isOpen ? null : s.key)} aria-expanded={isOpen}>
                      {isOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{sectionTitle(s)}</span>
                        <span className="block text-xs text-muted">{def?.name ?? s.type}</span>
                      </span>
                    </button>
                    {s.needs_review && <StatusBadge status="review" />}
                    {!s.visible && <StatusBadge status="hidden" />}
                    <button className="rounded-lg p-2 hover:bg-bg-alt" onClick={() => updSection(s.key, { visible: !s.visible })} aria-label={s.visible ? "Hide section" : "Show section"} title={s.visible ? "Hide" : "Show"}>
                      {s.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      className="rounded-lg p-2 hover:bg-bg-alt"
                      aria-label="Duplicate section"
                      title="Duplicate"
                      onClick={() => {
                        const idx = items.findIndex((i) => i.key === s.key);
                        const copy: EditSection = { ...items[idx], key: newKey(), id: `new-${newKey()}`, data: structuredClone(items[idx].data) };
                        setItems((xs) => [...xs.slice(0, idx + 1), copy, ...xs.slice(idx + 1)]);
                        setDirty(true);
                      }}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                      aria-label="Delete section"
                      title="Delete"
                      onClick={async () => {
                        if (!(await confirm({ title: "Delete section?", body: `"${sectionTitle(s)}" will be removed when you save.`, confirmLabel: "Delete", danger: true }))) return;
                        setItems((xs) => xs.filter((x) => x.key !== s.key));
                        setDirty(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {isOpen && def && (
                    <div className="space-y-5 border-t border-line p-5">
                      <p className="text-sm text-muted">{def.description}</p>
                      <AutoForm fields={def.fields} value={s.data as Record<string, unknown>} onChange={(v) => updSection(s.key, { data: v })} mediaUrls={mediaUrls} />
                      <div className="space-y-3 rounded-xl bg-bg-alt/60 p-4">
                        <TextInput label="Admin label (optional, not shown on the site)" value={s.label ?? ""} onChange={(v) => updSection(s.key, { label: v || null })} max={80} />
                        <Toggle label="Flag for review" checked={s.needs_review} onChange={(v) => updSection(s.key, { needs_review: v })} help="Shows this section in 'Needs your review' on the dashboard." />
                        {s.needs_review && <TextArea label="Review note" value={s.review_note ?? ""} onChange={(v) => updSection(s.key, { review_note: v || null })} max={500} rows={2} />}
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          />
          <Button variant="secondary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add section
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Page">
            <TextInput label="Title" value={p.title} onChange={(v) => upd("title", v)} max={160} required />
            <TextInput
              label="URL slug"
              value={p.slug}
              onChange={(v) => upd("slug", v.toLowerCase().replace(/[^a-z0-9/-]/g, "-"))}
              help={p.slug === "home" ? "The homepage slug is fixed." : "Lowercase letters, numbers and hyphens. Changing it changes the page's address: add a redirect from the old URL."}
            />
            <Select
              label="Status"
              value={p.status}
              onChange={(v) => upd("status", v as Page["status"])}
              options={[
                { value: "draft", label: "Draft (only visible in preview)" },
                { value: "published", label: "Published (public)" },
              ]}
            />
            <Toggle label="Include in sitemap" checked={p.show_in_sitemap} onChange={(v) => upd("show_in_sitemap", v)} />
            <Toggle label="Flag page for review" checked={p.needs_review} onChange={(v) => upd("needs_review", v)} />
            {p.needs_review && <TextArea label="Review note" value={p.review_note ?? ""} onChange={(v) => upd("review_note", v || null)} max={500} rows={2} />}
          </Card>
          <Card title="Search engines & sharing">
            <TextInput label="SEO title" value={p.seo_title ?? ""} onChange={(v) => upd("seo_title", v || null)} max={70} help="Shown in search results and browser tabs. Defaults to the page title." />
            <TextArea label="Meta description" value={p.seo_description ?? ""} onChange={(v) => upd("seo_description", v || null)} max={200} rows={3} help="Aim for 120–160 characters." />
            <MediaField label="Social sharing image" value={p.og_image_id} onChange={(id) => upd("og_image_id", id)} preview={p.og_image_id ? mediaUrls[p.og_image_id] : undefined} help="1200 × 630 px works best." />
            <TextInput label="Canonical URL (advanced)" value={p.canonical_url ?? ""} onChange={(v) => upd("canonical_url", v || null)} help="Leave empty unless this page duplicates another URL." />
            <Toggle label="Hide from search engines (noindex)" checked={p.noindex} onChange={(v) => upd("noindex", v)} />
            <div className="rounded-xl border border-line p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Search preview</p>
              <p className="mt-2 truncate text-lg text-[#1a0dab] [[data-theme=dark]_&]:text-[#8ab4f8]">{p.seo_title || p.title}</p>
              <p className="text-sm text-emerald-800 [[data-theme=dark]_&]:text-emerald-400">www.kydmasong.net{path}</p>
              <p className="line-clamp-2 text-sm text-muted">{p.seo_description || "No description yet."}</p>
            </div>
          </Card>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a section" wide>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedDefs.map((d) => (
            <li key={d.type}>
              <button
                className="h-full w-full rounded-xl border border-line p-4 text-left transition hover:border-navy hover:bg-bg-alt"
                onClick={() => {
                  const key = newKey();
                  setItems((xs) => [...xs, { key, id: `new-${key}`, type: d.type, label: null, data: structuredClone(d.defaults), visible: true, needs_review: false, review_note: null }]);
                  setOpen(key);
                  setAdding(false);
                  setDirty(true);
                }}
              >
                <span className="flex items-center gap-2 font-semibold">
                  {d.type === "stats" || d.type === "testimonials" ? <Flag size={14} className="text-orange-600" /> : null}
                  {d.name}
                </span>
                <span className="mt-1 block text-sm text-muted">{d.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
