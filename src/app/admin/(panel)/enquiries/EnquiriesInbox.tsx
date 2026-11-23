"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Archive, Inbox, Mail, Trash2 } from "@/components/icons";
import clsx from "clsx";
import { deleteEnquiry, setEnquiryStatus } from "@/app/admin/actions/site";
import type { ContactSubmission } from "@/lib/types";
import { Button, PageHeading, StatusBadge, useConfirm, useToast } from "@/components/admin/ui";

export function EnquiriesInbox({ items: initial }: { items: ContactSubmission[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<"inbox" | "archived">("inbox");
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = useMemo(() => items.filter((i) => (filter === "inbox" ? i.status !== "archived" : i.status === "archived")), [items, filter]);
  const open = items.find((i) => i.id === openId);

  const setStatus = async (id: string, status: ContactSubmission["status"]) => {
    const r = await setEnquiryStatus(id, status);
    if (!r.ok) return toast("error", r.error);
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status } : x)));
    router.refresh();
  };

  return (
    <>
      <PageHeading title="Enquiries" description="Messages sent through the contact form. Stored securely; only administrators can read them." />
      <div className="mb-4 flex gap-2">
        {(["inbox", "archived"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={clsx("inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold", filter === f ? "bg-navy text-white" : "border border-line bg-surface")}>
            {f === "inbox" ? <Inbox size={15} /> : <Archive size={15} />} {f === "inbox" ? "Inbox" : "Archived"}
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {shown.length === 0 && <li className="p-6 text-sm text-muted">No enquiries here.</li>}
          {shown.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => {
                  setOpenId(e.id);
                  if (e.status === "new") setStatus(e.id, "read");
                }}
                className={clsx("block w-full px-4 py-3 text-left hover:bg-bg-alt", openId === e.id && "bg-bg-alt")}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={clsx("truncate", e.status === "new" ? "font-bold" : "font-medium")}>{e.full_name}</span>
                  <span className="shrink-0 text-xs text-muted">{new Date(e.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                </span>
                <span className="block truncate text-sm text-muted">
                  {e.enquiry_type}
                  {e.subject ? ` · ${e.subject}` : ""}
                </span>
                {e.status === "new" && <StatusBadge status="new" />}
              </button>
            </li>
          ))}
        </ul>
        <div className="rounded-2xl border border-line bg-surface p-6">
          {open ? (
            <article>
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                <div>
                  <h2 className="text-xl font-semibold">{open.subject || open.enquiry_type}</h2>
                  <p className="mt-1 text-sm">
                    <strong>{open.full_name}</strong> · <a className="underline" href={`mailto:${open.email}`}>{open.email}</a>
                  </p>
                  <p className="text-xs text-muted">
                    {open.enquiry_type} · {new Date(open.created_at).toLocaleString("en-GB")} · Privacy consent given
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`mailto:${open.email}?subject=${encodeURIComponent("Re: " + (open.subject || open.enquiry_type))}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-navy"
                  >
                    <Mail size={15} /> Reply by email
                  </a>
                  {open.status !== "archived" ? (
                    <Button variant="secondary" size="sm" onClick={() => setStatus(open.id, "archived")}>
                      <Archive size={15} /> Archive
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setStatus(open.id, "read")}>
                      <Inbox size={15} /> Move to inbox
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={async () => {
                      if (!(await confirm({ title: "Delete enquiry?", body: "This message will be permanently deleted.", confirmLabel: "Delete", danger: true }))) return;
                      const r = await deleteEnquiry(open.id);
                      if (!r.ok) return toast("error", r.error);
                      setItems((xs) => xs.filter((x) => x.id !== open.id));
                      setOpenId(null);
                      router.refresh();
                    }}
                  >
                    <Trash2 size={15} /> Delete
                  </Button>
                </div>
              </header>
              {/* Rendered as plain text: never as HTML */}
              <p className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{open.message}</p>
            </article>
          ) : (
            <p className="text-muted">Select an enquiry to read it.</p>
          )}
        </div>
      </div>
    </>
  );
}
