"use client";
import { useCallback, useEffect, useState } from "react";
import { FileText, ImageIcon, Search, Upload, X } from "lucide-react";
import { listMedia, registerMedia, type MediaItem } from "@/app/admin/actions/media";
import { browserClient } from "@/lib/supabase/browser";
import { Button, Field, Modal, inputCls, useToast } from "./ui";

/** Reads image dimensions in the browser before upload. */
export function imageSize(file: File): Promise<{ width: number | null; height: number | null }> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return Promise.resolve({ width: null, height: null });
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve({ width: null, height: null });
    img.src = URL.createObjectURL(file);
  });
}

export function safeFileName(name: string) {
  const ext = (name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
  return `${base}.${ext || "bin"}`;
}

/** Upload one file from the browser to Storage (admin session), then register it. */
export async function uploadFile(file: File, folderId: string | null, alt = ""): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: `${file.name}: files must be 10 MB or smaller` };
  const path = `uploads/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID().slice(0, 8)}-${safeFileName(file.name)}`;
  const { error } = await browserClient().storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: `${file.name}: ${error.message}` };
  const dims = await imageSize(file);
  const res = await registerMedia({
    storage_path: path,
    file_name: file.name.slice(0, 200),
    mime_type: file.type,
    size_bytes: file.size,
    width: dims.width,
    height: dims.height,
    alt,
    folder_id: folderId,
  });
  return res.ok ? { ok: true, id: res.data!.id } : { ok: false, error: res.error };
}

export function MediaPickerModal({ open, onClose, onPick, imagesOnly = true }: { open: boolean; onClose: () => void; onPick: (m: MediaItem) => void; imagesOnly?: boolean }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [q, setQ] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const key = `${q}|${imagesOnly}|${reload}`;
  const loading = open && loadedKey !== key;
  const load = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listMedia({ q, imagesOnly }).then((r) => {
      if (cancelled) return;
      setItems(r);
      setLoadedKey(`${q}|${imagesOnly}|${reload}`);
    });
    return () => {
      cancelled = true;
    };
  }, [open, q, imagesOnly, reload]);

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    for (const f of Array.from(files)) {
      const r = await uploadFile(f, null);
      if (!r.ok) toast("error", r.error);
    }
    setUploading(false);
    load();
  };

  return (
    <Modal open={open} onClose={onClose} title="Choose from the media library" wide>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or alt text" className={`${inputCls} pl-9`} />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy">
          <Upload size={16} /> {uploading ? "Uploading…" : "Upload"}
          <input type="file" multiple accept={imagesOnly ? "image/*" : "image/*,application/pdf"} className="sr-only" onChange={(e) => onUpload(e.target.files)} />
        </label>
      </div>
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted">No media yet. Upload a file to get started.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(m);
                  onClose();
                }}
                className="group w-full overflow-hidden rounded-xl border border-line text-left transition hover:border-navy focus-visible:border-navy"
              >
                <div className="grid aspect-square place-items-center bg-bg-alt">
                  {m.mime_type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <FileText size={32} className="text-muted" />
                  )}
                </div>
                <p className="truncate px-2 py-1.5 text-xs">{m.file_name}</p>
                {!m.alt && m.mime_type.startsWith("image/") && <p className="px-2 pb-1.5 text-[11px] font-semibold text-orange-700">No alt text</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

/** Form field: shows the chosen image and lets you choose, change or remove it. */
export function MediaField({ label, value, onChange, preview, help }: { label: string; value: string | null; onChange: (id: string | null, item?: MediaItem) => void; preview?: string; help?: string }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<{ id: string; url: string } | null>(null);
  const thumb = picked && picked.id === value ? picked.url : preview;
  return (
    <Field label={label} help={help}>
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-bg-alt">
          {value && thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : value ? (
            <ImageIcon size={22} className="text-muted" />
          ) : (
            <ImageIcon size={22} className="text-muted/40" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            {value ? "Change" : "Choose image"}
          </Button>
          {value && (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X size={14} /> Remove
            </Button>
          )}
        </div>
      </div>
      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onPick={(m) => {
          setPicked({ id: m.id, url: m.url });
          onChange(m.id, m);
        }}
      />
    </Field>
  );
}
