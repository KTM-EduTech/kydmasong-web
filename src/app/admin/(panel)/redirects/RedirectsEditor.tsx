"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "@/components/icons";
import { deleteRedirect, saveRedirect } from "@/app/admin/actions/site";
import type { Redirect } from "@/lib/types";
import { Button, Modal, PageHeading, Select, TextInput, Toggle, useConfirm, useToast } from "@/components/admin/ui";

type R = Omit<Redirect, "id">;

export function RedirectsEditor({ items }: { items: Redirect[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [edit, setEdit] = useState<{ id: string | null; v: R } | null>(null);
  return (
    <>
      <PageHeading
        title="Redirects"
        description="Send visitors from an old address to a new one. Applies to addresses that don't match an existing page."
        actions={
          <Button variant="gold" onClick={() => setEdit({ id: null, v: { source: "/", destination: "/", status_code: 301, enabled: true } })}>
            <Plus size={16} /> New redirect
          </Button>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-bg-alt text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">From</th>
              <th className="px-4 py-3 font-semibold">To</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted">
                  No redirects.
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-bg-alt" onClick={() => setEdit({ id: r.id, v: { source: r.source, destination: r.destination, status_code: r.status_code, enabled: r.enabled } })}>
                <td className="px-4 py-3 font-mono">{r.source}</td>
                <td className="px-4 py-3 font-mono">{r.destination}</td>
                <td className="px-4 py-3">{r.status_code === 301 || r.status_code === 308 ? "Permanent" : "Temporary"}</td>
                <td className="px-4 py-3">{r.enabled ? "On" : "Off"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                    aria-label={`Delete redirect from ${r.source}`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!(await confirm({ title: "Delete redirect?", body: `${r.source} will stop redirecting.`, confirmLabel: "Delete", danger: true }))) return;
                      const res = await deleteRedirect(r.id);
                      if (!res.ok) return toast("error", res.error);
                      router.refresh();
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit redirect" : "New redirect"}>
        {edit && (
          <div className="space-y-4">
            <TextInput label="From path" value={edit.v.source} onChange={(v) => setEdit({ ...edit, v: { ...edit.v, source: v } })} help="e.g. /old-page" />
            <TextInput label="To" value={edit.v.destination} onChange={(v) => setEdit({ ...edit, v: { ...edit.v, destination: v } })} help="A path like /new-page or a full https:// URL" />
            <Select
              label="Type"
              value={String(edit.v.status_code)}
              onChange={(v) => setEdit({ ...edit, v: { ...edit.v, status_code: Number(v) } })}
              options={[
                { value: "301", label: "Permanent (301) — the page has moved for good" },
                { value: "302", label: "Temporary (302)" },
              ]}
            />
            <Toggle label="Enabled" checked={edit.v.enabled} onChange={(v) => setEdit({ ...edit, v: { ...edit.v, enabled: v } })} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const r = await saveRedirect(edit.id, { ...edit.v, status_code: edit.v.status_code as 301 | 302 });
                  if (!r.ok) return toast("error", r.error);
                  setEdit(null);
                  toast("ok", "Redirect saved");
                  router.refresh();
                }}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
