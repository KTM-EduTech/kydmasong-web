"use client";
import { useState } from "react";
import { ArrowLeftToLine, ArrowRightToLine, Plus, Save, Trash2 } from "lucide-react";
import clsx from "clsx";
import { saveMenu } from "@/app/admin/actions/site";
import type { NavItem } from "@/lib/types";
import { SortableList } from "@/components/admin/Sortable";
import { Button, PageHeading, Select, StatusBadge, TextInput, Toggle, useConfirm, useToast, useUnsavedWarning } from "@/components/admin/ui";

const MENUS = [
  { key: "header", label: "Main menu (header)", nested: true },
  { key: "footer_resources", label: "Footer: Resources" },
  { key: "footer_quick_links", label: "Footer: Quick links" },
  { key: "footer_tools", label: "Footer: Tools" },
  { key: "footer_legal", label: "Footer: Legal links" },
] as const;

type Item = Pick<NavItem, "id" | "parent_id" | "label" | "page_id" | "url" | "open_in_new_tab" | "is_button" | "enabled">;
type PageOpt = { id: string; title: string; slug: string; status: string };

/** Flat list where children follow their parent; depth comes from parent_id. */
function ordered(items: NavItem[], menu: string): Item[] {
  const mine = items.filter((i) => i.menu === menu);
  const top = mine.filter((i) => !i.parent_id).sort((a, b) => a.position - b.position);
  const out: Item[] = [];
  top.forEach((t) => {
    out.push(t);
    mine.filter((c) => c.parent_id === t.id).sort((a, b) => a.position - b.position).forEach((c) => out.push(c));
  });
  return out;
}

export function NavEditor({ items, pages }: { items: NavItem[]; pages: PageOpt[] }) {
  const [menu, setMenu] = useState<(typeof MENUS)[number]["key"]>("header");
  const [lists, setLists] = useState<Record<string, Item[]>>(() => Object.fromEntries(MENUS.map((m) => [m.key, ordered(items, m.key)])));
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  useUnsavedWarning(dirty);
  const list = lists[menu];
  const nested = menu === "header";
  const setList = (next: Item[]) => {
    setLists((l) => ({ ...l, [menu]: next }));
    setDirty(true);
  };
  const upd = (id: string, patch: Partial<Item>) => setList(list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  // Parent of an item = nearest preceding top-level item (used after drag and indent).
  const normalise = (xs: Item[]) => {
    let lastTop: string | null = null;
    return xs.map((i, idx) => {
      if (!i.parent_id || idx === 0) {
        lastTop = i.id;
        return { ...i, parent_id: null };
      }
      return { ...i, parent_id: lastTop };
    });
  };

  const save = async () => {
    setSaving(true);
    const r = await saveMenu(menu, list);
    setSaving(false);
    if (!r.ok) return toast("error", r.error);
    setDirty(false);
    toast("ok", "Menu saved. The website is updated.");
  };

  const sel = list.find((i) => i.id === selected);
  const pageLabel = (id: string | null) => pages.find((p) => p.id === id);

  return (
    <>
      <PageHeading
        title="Navigation"
        description="Edit the header and footer menus. Drag to reorder; indent an item to put it in a dropdown."
        actions={
          <Button onClick={save} disabled={saving || !dirty}>
            <Save size={16} /> {saving ? "Saving…" : "Save menu"}
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {MENUS.map((m) => (
          <button
            key={m.key}
            role="tab"
            aria-selected={menu === m.key}
            onClick={async () => {
              if (dirty && !(await confirm({ title: "Unsaved changes", body: "Switch menus without saving?", confirmLabel: "Discard changes" }))) return;
              if (dirty) {
                setLists(Object.fromEntries(MENUS.map((x) => [x.key, ordered(items, x.key)])));
                setDirty(false);
              }
              setMenu(m.key);
              setSelected(null);
            }}
            className={clsx("rounded-full px-4 py-2 text-sm font-semibold", menu === m.key ? "bg-navy text-white" : "border border-line bg-surface")}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div>
          <SortableList
            items={list}
            onReorder={(next) => setList(nested ? normalise(next) : next)}
            render={(i, handle, idx) => {
              const page = pageLabel(i.page_id);
              return (
                <div
                  className={clsx(
                    "flex items-center gap-2 rounded-xl border bg-surface px-2 py-2",
                    selected === i.id ? "border-navy ring-2 ring-gold/60" : "border-line",
                    i.parent_id && "ml-10",
                    !i.enabled && "opacity-60",
                  )}
                >
                  {handle}
                  <button className="min-w-0 flex-1 text-left" onClick={() => setSelected(i.id)}>
                    <span className="block font-semibold">{i.label || "Untitled"}</span>
                    <span className="block truncate text-xs text-muted">
                      {page ? `Page: ${page.title}${page.status !== "published" ? " (draft, hidden)" : ""}` : i.url}
                    </span>
                  </button>
                  {i.is_button && <StatusBadge status="draft" />}
                  {!i.enabled && <StatusBadge status="hidden" />}
                  {nested && idx > 0 && (
                    <button
                      className="rounded-lg p-2 hover:bg-bg-alt"
                      onClick={() => setList(normalise(list.map((x) => (x.id === i.id ? { ...x, parent_id: x.parent_id ? null : "x" } : x))))}
                      aria-label={i.parent_id ? "Move out of dropdown" : "Move into dropdown above"}
                      title={i.parent_id ? "Outdent" : "Indent into dropdown"}
                    >
                      {i.parent_id ? <ArrowLeftToLine size={16} /> : <ArrowRightToLine size={16} />}
                    </button>
                  )}
                  <button
                    className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                    aria-label={`Remove ${i.label}`}
                    onClick={() => {
                      setList(normalise(list.filter((x) => x.id !== i.id && x.parent_id !== i.id)));
                      if (selected === i.id) setSelected(null);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            }}
          />
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => {
              const id = `tmp-${Math.random().toString(36).slice(2)}`;
              setList([...list, { id, parent_id: null, label: "New link", page_id: null, url: "/", open_in_new_tab: false, is_button: false, enabled: true }]);
              setSelected(id);
            }}
          >
            <Plus size={16} /> Add item
          </Button>
        </div>
        <aside className="rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24 lg:self-start">
          {sel ? (
            <div className="space-y-4">
              <h2 className="font-semibold">Edit item</h2>
              <TextInput label="Label" value={sel.label} onChange={(v) => upd(sel.id, { label: v })} max={80} />
              <Select
                label="Links to"
                value={sel.page_id ? "page" : "url"}
                onChange={(v) => upd(sel.id, v === "page" ? { page_id: pages[0]?.id ?? null, url: null } : { page_id: null, url: "/" })}
                options={[
                  { value: "page", label: "A page on this site" },
                  { value: "url", label: "A URL (external site or path)" },
                ]}
              />
              {sel.page_id ? (
                <Select
                  label="Page"
                  value={sel.page_id}
                  onChange={(v) => upd(sel.id, { page_id: v })}
                  options={pages.map((p) => ({ value: p.id, label: `${p.title}${p.status !== "published" ? " (draft)" : ""}` }))}
                  help="If the page is unpublished, the link hides itself automatically."
                />
              ) : (
                <TextInput label="URL" value={sel.url ?? ""} onChange={(v) => upd(sel.id, { url: v })} help="e.g. /contact-us or https://github.com/KTM-EduTech" />
              )}
              <Toggle label="Enabled" checked={sel.enabled} onChange={(v) => upd(sel.id, { enabled: v })} help="Disabled items are kept but not shown." />
              <Toggle label="Open in a new tab" checked={sel.open_in_new_tab} onChange={(v) => upd(sel.id, { open_in_new_tab: v })} />
              {menu === "header" && !sel.parent_id && (
                <Toggle label="Show as gold button" checked={sel.is_button} onChange={(v) => upd(sel.id, { is_button: v })} />
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">Select an item to edit its label, destination and options.</p>
          )}
        </aside>
      </div>
    </>
  );
}
