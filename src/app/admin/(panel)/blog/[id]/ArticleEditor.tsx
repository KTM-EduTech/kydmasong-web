"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Eye, Save, Trash2 } from "@/components/icons";
import { deleteArticle, saveArticle } from "@/app/admin/actions/content";
import type { Article } from "@/lib/types";
import { MediaField } from "@/components/admin/MediaPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button, Card, Field, Select, StatusBadge, TextArea, TextInput, inputCls, useConfirm, useToast, useUnsavedWarning } from "@/components/admin/ui";

type A = Omit<Article, "id" | "created_at" | "updated_at">;

/** "2026-11-22T10:30" in local time <-> ISO */
const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function ArticleEditor({ id, initial, tagIds, categories, tags, imageUrl }: { id: string | null; initial: A; tagIds: string[]; categories: { id: string; name: string }[]; tags: { id: string; name: string }[]; imageUrl?: string }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [a, setA] = useState<A>(initial);
  const [selTags, setSelTags] = useState(tagIds);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useUnsavedWarning(dirty);
  const upd = <K extends keyof A>(k: K, v: A[K]) => {
    setA((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };

  const save = async (status?: A["status"]) => {
    setSaving(true);
    const r = await saveArticle(
      id,
      {
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        body: a.body,
        featured_image_id: a.featured_image_id,
        category_id: a.category_id,
        status: status ?? a.status,
        published_at: a.published_at,
        seo_title: a.seo_title,
        seo_description: a.seo_description,
      },
      selTags,
    );
    setSaving(false);
    if (!r.ok) return toast("error", r.error);
    setDirty(false);
    if (status) setA((x) => ({ ...x, status }));
    toast("ok", "Post saved");
    if (!id) router.replace(`/admin/blog/${r.data!.id}`);
    else router.refresh();
  };

  const scheduled = a.status === "published" && a.published_at && new Date(a.published_at) > new Date();

  return (
    <div>
      <Link href="/admin/blog" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} /> Blog
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{a.title || "New post"}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <StatusBadge status={scheduled ? "scheduled" : a.status} /> {dirty && <span className="font-semibold text-orange-700">Unsaved changes</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {id && (
            <a href={`/api/preview?path=/blog/${a.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold">
              <Eye size={16} /> Preview
            </a>
          )}
          {a.status === "published" ? (
            <Button variant="secondary" onClick={() => save("draft")} disabled={saving}>
              Unpublish
            </Button>
          ) : (
            <Button variant="gold" onClick={() => save("published")} disabled={saving || !a.title.trim()}>
              Publish
            </Button>
          )}
          <Button onClick={() => save()} disabled={saving || !a.title.trim()}>
            <Save size={16} /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <Card title="Post">
          <TextInput label="Title" value={a.title} onChange={(v) => upd("title", v)} max={200} required />
          <TextArea label="Excerpt" value={a.excerpt ?? ""} onChange={(v) => upd("excerpt", v || null)} max={400} rows={2} help="Short summary shown on the blog page." />
          <RichTextEditor label="Article" value={a.body} onChange={(v) => upd("body", v)} />
        </Card>
        <div className="space-y-5">
          <Card title="Publishing">
            <TextInput label="URL slug" value={a.slug} onChange={(v) => upd("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} help={`/blog/${a.slug || "(from title)"}`} />
            <Field label="Publish date" help="Set a future date to schedule the post. Leave empty to publish immediately.">
              <input type="datetime-local" className={inputCls} value={toLocal(a.published_at)} onChange={(e) => upd("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)} />
            </Field>
            <MediaField label="Featured image" value={a.featured_image_id} preview={imageUrl} onChange={(mid) => upd("featured_image_id", mid)} />
          </Card>
          <Card title="Category & tags">
            <Select label="Category" value={a.category_id ?? ""} onChange={(v) => upd("category_id", v || null)} options={[{ value: "", label: "None" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
            <Field label="Tags">
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 && <p className="text-sm text-muted">No blog tags yet. Add them under Categories &amp; tags.</p>}
                {tags.map((t) => (
                  <label key={t.id} className="inline-flex cursor-pointer items-center rounded-full border border-line px-3 py-1 text-sm has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-white">
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
            <TextInput label="SEO title" value={a.seo_title ?? ""} onChange={(v) => upd("seo_title", v || null)} max={70} />
            <TextArea label="Meta description" value={a.seo_description ?? ""} onChange={(v) => upd("seo_description", v || null)} max={200} rows={3} />
          </Card>
          {id && (
            <Button
              variant="danger"
              className="w-full"
              onClick={async () => {
                if (!(await confirm({ title: "Delete post?", body: `"${a.title}" will be permanently deleted.`, confirmLabel: "Delete post", danger: true }))) return;
                const r = await deleteArticle(id, a.title);
                if (!r.ok) return toast("error", r.error);
                setDirty(false);
                router.push("/admin/blog");
              }}
            >
              <Trash2 size={15} /> Delete post
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
