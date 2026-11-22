"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { deleteTaxonomy, saveTaxonomy } from "@/app/admin/actions/content";
import type { Category, Tag } from "@/lib/types";
import { Button, Card, PageHeading, inputCls, useConfirm, useToast } from "@/components/admin/ui";

type Row = { id: string; name: string; scope: "project" | "article" };

function List({ kind, scope, rows }: { kind: "categories" | "tags"; scope: "project" | "article"; rows: Row[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const add = async () => {
    const r = await saveTaxonomy(kind, scope, null, name);
    if (!r.ok) return toast("error", r.error);
    setName("");
    router.refresh();
  };
  return (
    <Card title={`${scope === "project" ? "Project" : "Blog"} ${kind}`}>
      <ul className="divide-y divide-line">
        {rows.length === 0 && <li className="py-2 text-sm text-muted">None yet.</li>}
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-2 py-2">
            {editing?.id === r.id ? (
              <>
                <input className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} aria-label="Name" />
                <button
                  className="rounded-lg p-2 hover:bg-bg-alt"
                  aria-label="Save"
                  onClick={async () => {
                    const res = await saveTaxonomy(kind, scope, r.id, editing.name);
                    if (!res.ok) return toast("error", res.error);
                    setEditing(null);
                    router.refresh();
                  }}
                >
                  <Check size={16} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{r.name}</span>
                <button className="rounded-lg p-2 hover:bg-bg-alt" aria-label={`Rename ${r.name}`} onClick={() => setEditing({ id: r.id, name: r.name })}>
                  <Pencil size={15} />
                </button>
                <button
                  className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                  aria-label={`Delete ${r.name}`}
                  onClick={async () => {
                    if (!(await confirm({ title: "Delete?", body: `"${r.name}" will be removed from any items that use it.`, confirmLabel: "Delete", danger: true }))) return;
                    const res = await deleteTaxonomy(kind, r.id);
                    if (!res.ok) return toast("error", res.error);
                    router.refresh();
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder={`New ${kind === "categories" ? "category" : "tag"}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && add()}
          aria-label={`New ${kind === "categories" ? "category" : "tag"} name`}
        />
        <Button variant="secondary" onClick={add} disabled={!name.trim()}>
          Add
        </Button>
      </div>
    </Card>
  );
}

export function TaxonomyEditor({ categories, tags }: { categories: Category[]; tags: Tag[] }) {
  return (
    <>
      <PageHeading title="Categories & tags" description="Organise projects and blog posts." />
      <div className="grid gap-5 lg:grid-cols-2">
        <List kind="categories" scope="project" rows={categories.filter((c) => c.scope === "project")} />
        <List kind="tags" scope="project" rows={tags.filter((t) => t.scope === "project")} />
        <List kind="categories" scope="article" rows={categories.filter((c) => c.scope === "article")} />
        <List kind="tags" scope="article" rows={tags.filter((t) => t.scope === "article")} />
      </div>
    </>
  );
}
