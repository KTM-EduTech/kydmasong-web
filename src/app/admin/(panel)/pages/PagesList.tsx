"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { createPage, deletePage, duplicatePage, reorderPages, setPageStatus } from "@/app/admin/actions/pages";
import { Button, Modal, PageHeading, StatusBadge, TextInput, useConfirm, useToast } from "@/components/admin/ui";
import { SortableList } from "@/components/admin/Sortable";

type Row = { id: string; title: string; slug: string; status: string; needs_review: boolean; updated_at: string; sort_order: number };

export function PagesList({ pages, openNew }: { pages: Row[]; openNew: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState(pages);
  const [creating, setCreating] = useState(openNew);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const r = await createPage({ title, slug });
    setBusy(false);
    if (!r.ok) return toast("error", r.error);
    router.push(`/admin/pages/${r.data!.id}`);
  };

  const onReorder = async (next: Row[]) => {
    setItems(next);
    const r = await reorderPages(next.map((p) => p.id));
    if (!r.ok) toast("error", r.error);
  };

  return (
    <>
      <PageHeading
        title="Pages"
        description="Drag to reorder. Each page is built from sections you can add, edit, hide and reorder."
        actions={
          <Button variant="gold" onClick={() => setCreating(true)}>
            <Plus size={16} /> New page
          </Button>
        }
      />
      <SortableList
        items={items}
        onReorder={onReorder}
        render={(p, handle) => (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-3 py-3">
            {handle}
            <div className="min-w-0 flex-1">
              <Link href={`/admin/pages/${p.id}`} className="font-semibold hover:underline">
                {p.title}
              </Link>
              <p className="truncate text-sm text-muted">/{p.slug === "home" ? "" : p.slug}</p>
            </div>
            {p.needs_review && <StatusBadge status="review" />}
            <StatusBadge status={p.status} />
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const next = p.status === "published" ? "draft" : "published";
                  const r = await setPageStatus(p.id, next);
                  if (!r.ok) return toast("error", r.error);
                  setItems((xs) => xs.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
                  toast("ok", next === "published" ? "Published" : "Unpublished");
                }}
              >
                {p.status === "published" ? "Unpublish" : "Publish"}
              </Button>
              <a href={`/api/preview?path=/${p.slug === "home" ? "" : p.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 hover:bg-bg-alt" aria-label={`Preview ${p.title}`}>
                <Eye size={16} />
              </a>
              <Link href={`/admin/pages/${p.id}`} className="rounded-lg p-2 hover:bg-bg-alt" aria-label={`Edit ${p.title}`}>
                <Pencil size={16} />
              </Link>
              <button
                className="rounded-lg p-2 hover:bg-bg-alt"
                aria-label={`Duplicate ${p.title}`}
                onClick={async () => {
                  const r = await duplicatePage(p.id);
                  if (!r.ok) return toast("error", r.error);
                  router.push(`/admin/pages/${r.data!.id}`);
                }}
              >
                <Copy size={16} />
              </button>
              {p.slug !== "home" && (
                <button
                  className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                  aria-label={`Delete ${p.title}`}
                  onClick={async () => {
                    if (!(await confirm({ title: "Delete page?", body: `"${p.title}" and all its sections will be permanently deleted. Menu links to it will be hidden.`, confirmLabel: "Delete page", danger: true }))) return;
                    const r = await deletePage(p.id);
                    if (!r.ok) return toast("error", r.error);
                    setItems((xs) => xs.filter((x) => x.id !== p.id));
                    toast("ok", "Page deleted");
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      />
      <Modal open={creating} onClose={() => setCreating(false)} title="New page">
        <div className="space-y-4">
          <TextInput label="Title" value={title} onChange={setTitle} required max={160} />
          <TextInput label="URL slug (optional)" value={slug} onChange={setSlug} help="Leave empty to create it from the title, e.g. my-new-page" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={!title.trim() || busy}>
              Create draft
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
