"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "@/components/icons";
import { SortableList } from "./Sortable";
import { Button, Modal, PageHeading, StatusBadge, useConfirm, useToast } from "./ui";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Shared list + modal editor for simple collections (experience, skills, services).
 * `Form` edits a draft object; save/delete/reorder are server actions.
 */
export function CollectionManager<T extends { id: string; status: string; needs_review?: boolean }>({
  title,
  description,
  items: initial,
  blank,
  itemTitle,
  itemSubtitle,
  Form,
  onSave,
  onDelete,
  onReorder,
  groupBy,
}: {
  title: string;
  description: string;
  items: T[];
  blank: Omit<T, "id">;
  itemTitle: (t: T | Omit<T, "id">) => string;
  itemSubtitle?: (t: T) => string;
  Form: (props: { value: Omit<T, "id">; onChange: (v: Omit<T, "id">) => void }) => React.ReactNode;
  onSave: (id: string | null, value: Omit<T, "id">) => Promise<Result>;
  onDelete: (id: string, label: string) => Promise<Result>;
  onReorder: (ids: string[]) => Promise<Result>;
  groupBy?: (t: T) => string;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<{ id: string | null; value: Omit<T, "id"> } | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const r = await onSave(editing.id, editing.value);
    setSaving(false);
    if (!r.ok) return toast("error", r.error);
    toast("ok", "Saved");
    setEditing(null);
    router.refresh();
    if (editing.id) setItems((xs) => xs.map((x) => (x.id === editing.id ? ({ ...x, ...editing.value } as T) : x)));
    else setTimeout(() => window.location.reload(), 300);
  };

  return (
    <>
      <PageHeading
        title={title}
        description={description}
        actions={
          <Button variant="gold" onClick={() => setEditing({ id: null, value: structuredClone(blank) })}>
            <Plus size={16} /> Add
          </Button>
        }
      />
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-10 text-center text-muted">Nothing here yet.</p>
      ) : (
        <SortableList
          items={items}
          onReorder={async (next) => {
            setItems(next);
            const r = await onReorder(next.map((i) => i.id));
            if (!r.ok) toast("error", r.error);
          }}
          render={(item, handle, idx) => (
            <>
              {groupBy && (idx === 0 || groupBy(items[idx - 1]) !== groupBy(item)) && (
                <p className="px-1 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted">{groupBy(item)}</p>
              )}
              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-2 py-2">
                {handle}
                <button className="min-w-0 flex-1 text-left" onClick={() => setEditing({ id: item.id, value: structuredClone(item) })}>
                  <span className="block truncate font-semibold">{itemTitle(item)}</span>
                  {itemSubtitle && <span className="block truncate text-xs text-muted">{itemSubtitle(item)}</span>}
                </button>
                {item.needs_review && <StatusBadge status="review" />}
                <StatusBadge status={item.status} />
                <button className="rounded-lg p-2 hover:bg-bg-alt" onClick={() => setEditing({ id: item.id, value: structuredClone(item) })} aria-label={`Edit ${itemTitle(item)}`}>
                  <Pencil size={16} />
                </button>
                <button
                  className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                  aria-label={`Delete ${itemTitle(item)}`}
                  onClick={async () => {
                    if (!(await confirm({ title: "Delete?", body: `"${itemTitle(item)}" will be permanently deleted.`, confirmLabel: "Delete", danger: true }))) return;
                    const r = await onDelete(item.id, itemTitle(item));
                    if (!r.ok) return toast("error", r.error);
                    setItems((xs) => xs.filter((x) => x.id !== item.id));
                    toast("ok", "Deleted");
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </>
          )}
        />
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Edit: ${itemTitle(editing.value)}` : "Add new"} wide>
        {editing && (
          <div className="space-y-4">
            <Form value={editing.value} onChange={(v) => setEditing({ ...editing, value: v })} />
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
