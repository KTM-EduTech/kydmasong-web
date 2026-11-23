"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CloudDownload, Copy, FileText, FolderPlus, Link2, RefreshCw, Search, Trash2, Upload } from "@/components/icons";
import clsx from "clsx";
import {
  addExternalMedia,
  deleteFolder,
  deleteMedia,
  findMediaUsage,
  importExternalMedia,
  saveFolder,
  touchMedia,
  updateMedia,
  type MediaItem,
} from "@/app/admin/actions/media";
import { browserClient } from "@/lib/supabase/browser";
import { imageSize, uploadFile } from "@/components/admin/MediaPicker";
import { Button, Modal, PageHeading, Select, TextArea, TextInput, inputCls, useConfirm, useToast } from "@/components/admin/ui";

type Folder = { id: string; name: string };
const kb = (n: number | null) => (n ? (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`) : "—");

export function MediaLibrary({ items, folders }: { items: MediaItem[]; folders: Folder[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [folder, setFolder] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<MediaItem | null>(null);
  const [edit, setEdit] = useState({ alt: "", caption: "", folder_id: "", file_name: "" });
  const [busy, setBusy] = useState(false);
  const [extOpen, setExtOpen] = useState(false);
  const [ext, setExt] = useState({ url: "", alt: "" });
  const [usage, setUsage] = useState<string[] | null>(null);

  const shown = useMemo(
    () =>
      items.filter(
        (m) =>
          (folder === "all" || (folder === "none" ? !m.folder_id : m.folder_id === folder)) &&
          (!q || `${m.file_name} ${m.alt}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [items, folder, q],
  );

  const select = async (m: MediaItem) => {
    setSel(m);
    setEdit({ alt: m.alt, caption: m.caption ?? "", folder_id: m.folder_id ?? "", file_name: m.file_name });
    setUsage(null);
    setUsage(await findMediaUsage(m.id));
  };

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      const r = await uploadFile(f, folder !== "all" && folder !== "none" ? folder : null);
      if (r.ok) ok++;
      else toast("error", r.error);
    }
    setBusy(false);
    if (ok) toast("ok", `${ok} file${ok > 1 ? "s" : ""} uploaded. Remember to add alt text.`);
    router.refresh();
  };

  const onReplace = async (file: File | undefined) => {
    if (!file || !sel?.storage_path) return;
    setBusy(true);
    const { error } = await browserClient().storage.from("media").upload(sel.storage_path, file, { upsert: true, contentType: file.type });
    if (error) {
      setBusy(false);
      return toast("error", error.message);
    }
    const dims = await imageSize(file);
    const r = await touchMedia(sel.id, { size_bytes: file.size, width: dims.width, height: dims.height, mime_type: file.type });
    setBusy(false);
    if (!r.ok) return toast("error", r.error);
    toast("ok", "File replaced everywhere it is used.");
    setSel(null);
    router.refresh();
  };

  return (
    <>
      <PageHeading
        title="Media library"
        description="Images and documents used across the site. Every image should have alt text."
        actions={
          <>
            <Button variant="secondary" onClick={() => setExtOpen(true)}>
              <Link2 size={16} /> Add by URL
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy">
              <Upload size={16} /> {busy ? "Working…" : "Upload files"}
              <input type="file" multiple accept="image/*,application/pdf" className="sr-only" onChange={(e) => onUpload(e.target.files)} disabled={busy} />
            </label>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <aside className="space-y-1">
          {[{ id: "all", name: "All files" }, { id: "none", name: "Not in a folder" }, ...folders].map((f) => (
            <div key={f.id} className="group flex items-center">
              <button
                onClick={() => setFolder(f.id)}
                className={clsx("flex-1 rounded-lg px-3 py-2 text-left text-sm font-medium", folder === f.id ? "bg-navy text-white" : "hover:bg-bg-alt")}
              >
                {f.name}
              </button>
              {f.id !== "all" && f.id !== "none" && (
                <button
                  className="invisible rounded p-1.5 text-red-700 group-hover:visible"
                  aria-label={`Delete folder ${f.name}`}
                  onClick={async () => {
                    if (!(await confirm({ title: "Delete folder?", body: `Files in "${f.name}" are kept and moved to "Not in a folder".`, confirmLabel: "Delete folder", danger: true }))) return;
                    const r = await deleteFolder(f.id);
                    if (!r.ok) return toast("error", r.error);
                    setFolder("all");
                    router.refresh();
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={async () => {
              const name = prompt("Folder name");
              if (!name) return;
              const r = await saveFolder(null, name);
              if (!r.ok) return toast("error", r.error);
              router.refresh();
            }}
          >
            <FolderPlus size={15} /> New folder
          </Button>
        </aside>
        <div>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-3 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by file name or alt text" className={`${inputCls} pl-9`} />
          </div>
          {shown.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-10 text-center text-muted">No files here yet.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {shown.map((m) => (
                <li key={m.id}>
                  <button onClick={() => select(m)} className="w-full overflow-hidden rounded-xl border border-line bg-surface text-left transition hover:border-navy">
                    <div className="grid aspect-square place-items-center bg-bg-alt">
                      {m.mime_type.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <FileText size={30} className="text-muted" />
                      )}
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="truncate text-xs font-medium">{m.file_name}</p>
                      <p className="text-[11px]">
                        {m.external_url ? <span className="font-semibold text-orange-700">External link</span> : <span className="text-muted">{kb(m.size_bytes)}</span>}
                        {!m.alt && m.mime_type.startsWith("image/") && <span className="ml-1 font-semibold text-orange-700">· No alt</span>}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} title="Media details" wide>
        {sel && (
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <div>
              <div className="grid place-items-center overflow-hidden rounded-xl border border-line bg-bg-alt">
                {sel.mime_type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sel.url} alt="" className="max-h-80 w-auto" />
                ) : (
                  <FileText size={48} className="m-16 text-muted" />
                )}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-1 text-sm">
                <dt className="text-muted">Type</dt>
                <dd>{sel.mime_type}</dd>
                <dt className="text-muted">Size</dt>
                <dd>{kb(sel.size_bytes)}</dd>
                <dt className="text-muted">Dimensions</dt>
                <dd>{sel.width && sel.height ? `${sel.width} × ${sel.height}` : "—"}</dd>
                <dt className="text-muted">Stored</dt>
                <dd>{sel.external_url ? "External link (not copied)" : "In your Supabase library"}</dd>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(sel.url.split("?")[0]);
                    toast("ok", "URL copied");
                  }}
                >
                  <Copy size={14} /> Copy URL
                </Button>
                {sel.storage_path ? (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-ink/40">
                    <RefreshCw size={14} /> Replace file
                    <input type="file" accept={sel.mime_type.startsWith("image/") ? "image/*" : "application/pdf"} className="sr-only" onChange={(e) => onReplace(e.target.files?.[0])} />
                  </label>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      const r = await importExternalMedia(sel.id);
                      setBusy(false);
                      if (!r.ok) return toast("error", r.error);
                      toast("ok", r.message ?? "Imported");
                      setSel(null);
                      router.refresh();
                    }}
                  >
                    <CloudDownload size={14} /> Copy into library
                  </Button>
                )}
              </div>
              <div className="mt-4 rounded-xl bg-bg-alt/60 p-3 text-sm">
                <p className="font-semibold">Used in</p>
                {usage === null ? (
                  <p className="text-muted">Checking…</p>
                ) : usage.length === 0 ? (
                  <p className="text-muted">Not used anywhere. Safe to delete.</p>
                ) : (
                  <ul className="list-disc pl-5">
                    {usage.map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <TextInput label="File name" value={edit.file_name} onChange={(v) => setEdit({ ...edit, file_name: v })} max={200} />
              <TextArea
                label="Alternative text"
                value={edit.alt}
                onChange={(v) => setEdit({ ...edit, alt: v })}
                max={300}
                rows={3}
                help="Describe what the image shows for people using screen readers. Leave empty only for purely decorative images."
              />
              <TextInput label="Caption / description" value={edit.caption} onChange={(v) => setEdit({ ...edit, caption: v })} max={300} />
              <Select label="Folder" value={edit.folder_id} onChange={(v) => setEdit({ ...edit, folder_id: v })} options={[{ value: "", label: "Not in a folder" }, ...folders.map((f) => ({ value: f.id, label: f.name }))]} />
              <div className="flex flex-wrap justify-between gap-2 pt-2">
                <Button
                  variant="danger"
                  onClick={async () => {
                    const inUse = (usage ?? []).length > 0;
                    if (
                      !(await confirm({
                        title: "Delete file?",
                        body: inUse
                          ? `This file is still used in: ${usage!.join("; ")}. Deleting it will leave those places without an image. This cannot be undone.`
                          : "The file will be permanently deleted. This cannot be undone.",
                        confirmLabel: "Delete permanently",
                        danger: true,
                      }))
                    )
                      return;
                    const r = await deleteMedia(sel.id, inUse);
                    if (!r.ok) return toast("error", r.error);
                    toast("ok", "File deleted");
                    setSel(null);
                    router.refresh();
                  }}
                >
                  <Trash2 size={15} /> Delete
                </Button>
                <Button
                  onClick={async () => {
                    const r = await updateMedia(sel.id, { alt: edit.alt, caption: edit.caption || null, folder_id: edit.folder_id || null, file_name: edit.file_name });
                    if (!r.ok) return toast("error", r.error);
                    toast("ok", "Saved");
                    setSel(null);
                    router.refresh();
                  }}
                >
                  Save details
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={extOpen} onClose={() => setExtOpen(false)} title="Add an image by URL">
        <div className="space-y-4">
          <TextInput label="Image URL" value={ext.url} onChange={(v) => setExt({ ...ext, url: v })} placeholder="https://…" />
          <TextArea label="Alternative text" value={ext.alt} onChange={(v) => setExt({ ...ext, alt: v })} max={300} rows={2} />
          <p className="text-sm text-muted">The image stays on its original host. Use “Copy into library” afterwards to store your own copy.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setExtOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const r = await addExternalMedia({ url: ext.url, alt: ext.alt, folder_id: null });
                if (!r.ok) return toast("error", r.error);
                setExt({ url: "", alt: "" });
                setExtOpen(false);
                router.refresh();
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
