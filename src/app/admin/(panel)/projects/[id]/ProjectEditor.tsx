"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Eye, Plus, Save, Trash2, X } from "@/components/icons";
import { deleteProject, saveProject } from "@/app/admin/actions/content";
import type { Project } from "@/lib/types";
import { LinksEditor } from "@/components/admin/LinksEditor";
import { MediaField, MediaPickerModal } from "@/components/admin/MediaPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button, Card, Field, Select, StatusBadge, TextArea, TextInput, Toggle, useConfirm, useToast, useUnsavedWarning } from "@/components/admin/ui";

type P = Omit<Project, "id" | "created_at" | "updated_at">;

export function ProjectEditor({ id, initial, tagIds, categories, tags, mediaUrls }: { id: string | null; initial: P; tagIds: string[]; categories: { id: string; name: string }[]; tags: { id: string; name: string }[]; mediaUrls: Record<string, string> }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [p, setP] = useState<P>(initial);
  const [selTags, setSelTags] = useState<string[]>(tagIds);
  const [urls, setUrls] = useState(mediaUrls);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useUnsavedWarning(dirty);
  const upd = <K extends keyof P>(k: K, v: P[K]) => {
    setP((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };

  const save = async (status?: P["status"]) => {
    setSaving(true);
    const r = await saveProject(
      id,
      {
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        body: p.body,
        cover_id: p.cover_id,
        gallery_ids: p.gallery_ids,
        links: p.links.filter((l) => l.label.trim() || l.url.trim()),
        category_id: p.category_id,
        featured: p.featured,
        status: status ?? p.status,
        needs_review: p.needs_review,
        review_note: p.review_note,
        seo_title: p.seo_title,
        seo_description: p.seo_description,
      },
      selTags,
    );
    setSaving(false);
    if (!r.ok) return toast("error", r.error);
    setDirty(false);
    if (status) setP((x) => ({ ...x, status }));
    toast("ok", "Project saved");
    if (!id) router.replace(`/admin/projects/${r.data!.id}`);
    else router.refresh();
  };

  return (
    <div>
      <Link href="/admin/projects" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} /> Projects
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{p.title || "New project"}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <StatusBadge status={p.status} /> {dirty && <span className="font-semibold text-orange-700">Unsaved changes</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {id && (
            <a href={`/api/preview?path=/projects/${p.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold">
              <Eye size={16} /> Preview
            </a>
          )}
          {p.status === "published" ? (
            <Button variant="secondary" onClick={() => save("draft")} disabled={saving}>
              Unpublish
            </Button>
          ) : (
            <Button variant="gold" onClick={() => save("published")} disabled={saving || !p.title.trim()}>
              Save &amp; publish
            </Button>
          )}
          <Button onClick={() => save()} disabled={saving || !p.title.trim()}>
            <Save size={16} /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Card title="Content">
            <TextInput label="Title" value={p.title} onChange={(v) => upd("title", v)} max={160} required />
            <TextArea label="Short description" value={p.summary ?? ""} onChange={(v) => upd("summary", v || null)} max={600} rows={3} help="Shown on project cards." />
            <RichTextEditor label="Full description" value={p.body} onChange={(v) => upd("body", v)} />
            <LinksEditor label="External links" value={p.links} onChange={(v) => upd("links", v)} help="e.g. Live site, GitHub repository." />
          </Card>
          <Card title="Images">
            <MediaField
              label="Cover image"
              value={p.cover_id}
              preview={p.cover_id ? urls[p.cover_id] : undefined}
              onChange={(mid, item) => {
                if (mid && item) setUrls((u) => ({ ...u, [mid]: item.url }));
                upd("cover_id", mid);
              }}
            />
            <Field label="Gallery">
              <ul className="flex flex-wrap gap-2">
                {p.gallery_ids.map((g) => (
                  <li key={g} className="relative h-20 w-24 overflow-hidden rounded-lg border border-line bg-bg-alt">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {urls[g] && <img src={urls[g]} alt="" className="h-full w-full object-cover" />}
                    <button className="absolute right-1 top-1 rounded-full bg-navy p-1 text-white" onClick={() => upd("gallery_ids", p.gallery_ids.filter((x) => x !== g))} aria-label="Remove from gallery">
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
              <Button variant="secondary" size="sm" onClick={() => setGalleryOpen(true)}>
                <Plus size={15} /> Add image
              </Button>
              <MediaPickerModal
                open={galleryOpen}
                onClose={() => setGalleryOpen(false)}
                onPick={(m) => {
                  setUrls((u) => ({ ...u, [m.id]: m.url }));
                  if (!p.gallery_ids.includes(m.id)) upd("gallery_ids", [...p.gallery_ids, m.id]);
                }}
              />
            </Field>
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Publishing">
            <TextInput label="URL slug" value={p.slug} onChange={(v) => upd("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} help={`/projects/${p.slug || "(from title)"}`} />
            <Toggle label="Featured on homepage" checked={p.featured} onChange={(v) => upd("featured", v)} />
            <Toggle label="Flag for review" checked={p.needs_review} onChange={(v) => upd("needs_review", v)} />
            {p.needs_review && <TextArea label="Review note" value={p.review_note ?? ""} onChange={(v) => upd("review_note", v || null)} max={500} rows={2} />}
          </Card>
          <Card title="Category & tags">
            <Select label="Category" value={p.category_id ?? ""} onChange={(v) => upd("category_id", v || null)} options={[{ value: "", label: "None" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} help="Manage categories under Categories & tags." />
            <Field label="Tags">
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 && <p className="text-sm text-muted">No project tags yet.</p>}
                {tags.map((t) => (
                  <label key={t.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-white">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selTags.includes(t.id)}
                      onChange={(e) => {
                        setSelTags((s) => (e.target.checked ? [...s, t.id] : s.filter((x) => x !== t.id)));
                        setDirty(true);
                      }}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            </Field>
          </Card>
          <Card title="SEO">
            <TextInput label="SEO title" value={p.seo_title ?? ""} onChange={(v) => upd("seo_title", v || null)} max={70} />
            <TextArea label="Meta description" value={p.seo_description ?? ""} onChange={(v) => upd("seo_description", v || null)} max={200} rows={3} />
          </Card>
          {id && (
            <Button
              variant="danger"
              className="w-full"
              onClick={async () => {
                if (!(await confirm({ title: "Delete project?", body: `"${p.title}" will be permanently deleted.`, confirmLabel: "Delete project", danger: true }))) return;
                const r = await deleteProject(id, p.title);
                if (!r.ok) return toast("error", r.error);
                toast("ok", "Project deleted");
                setDirty(false);
                router.push("/admin/projects");
              }}
            >
              <Trash2 size={15} /> Delete project
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
