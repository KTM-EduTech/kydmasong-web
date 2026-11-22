"use client";
import { deleteExperience, reorderExperiences, saveExperience } from "@/app/admin/actions/content";
import type { Experience } from "@/lib/types";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { LinksEditor } from "@/components/admin/LinksEditor";
import { MediaField } from "@/components/admin/MediaPicker";
import { Field, Select, TextArea, TextInput, Toggle, inputCls } from "@/components/admin/ui";

type E = Omit<Experience, "id">;

export function ExperienceManager({ items, logos }: { items: Experience[]; logos: Record<string, string> }) {
  const blank: E = {
    role: "",
    organization: "",
    organization_url: null,
    location: null,
    start_label: null,
    end_label: null,
    sort_date: null,
    logo_id: null,
    summary: null,
    bullets: [],
    links: [],
    status: "draft",
    needs_review: false,
    review_note: null,
    sort_order: 0,
  };
  return (
    <CollectionManager<Experience>
      title="Work experience"
      description="Roles shown on the Work Experience page. Drag to set the order (newest first)."
      items={items}
      blank={blank}
      itemTitle={(e) => e.role || "New role"}
      itemSubtitle={(e) => `${e.organization} · ${[e.start_label, e.end_label].filter(Boolean).join(" – ") || "Dates pending"}`}
      onSave={(id, v) =>
        saveExperience(id, {
          role: v.role,
          organization: v.organization,
          organization_url: v.organization_url,
          location: v.location,
          start_label: v.start_label,
          end_label: v.end_label,
          sort_date: v.sort_date,
          logo_id: v.logo_id,
          summary: v.summary,
          bullets: v.bullets.map((b) => b.trim()).filter(Boolean),
          links: v.links.filter((l) => l.label.trim() && l.url.trim()),
          status: v.status,
          needs_review: v.needs_review,
          review_note: v.review_note,
        })
      }
      onDelete={deleteExperience}
      onReorder={reorderExperiences}
      Form={({ value: v, onChange }) => {
        const set = <K extends keyof E>(k: K, val: E[K]) => onChange({ ...v, [k]: val });
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Role / job title" value={v.role} onChange={(x) => set("role", x)} required max={160} />
            <TextInput label="Organisation" value={v.organization} onChange={(x) => set("organization", x)} required max={160} />
            <TextInput label="Organisation website" value={v.organization_url ?? ""} onChange={(x) => set("organization_url", x || null)} />
            <TextInput label="Location" value={v.location ?? ""} onChange={(x) => set("location", x || null)} />
            <TextInput label="Start (as shown)" value={v.start_label ?? ""} onChange={(x) => set("start_label", x || null)} help="e.g. May 2004" />
            <TextInput label="End (as shown)" value={v.end_label ?? ""} onChange={(x) => set("end_label", x || null)} help="e.g. Jul 2016 or Present" />
            <Field label="Sort date (optional)" help="Used only to order roles; not shown.">
              <input type="date" className={inputCls} value={v.sort_date ?? ""} onChange={(e) => set("sort_date", e.target.value || null)} />
            </Field>
            <Select
              label="Status"
              value={v.status}
              onChange={(x) => set("status", x as E["status"])}
              options={[
                { value: "draft", label: "Draft (hidden)" },
                { value: "published", label: "Published" },
              ]}
            />
            <div className="md:col-span-2">
              <MediaField label="Logo" value={v.logo_id} preview={v.logo_id ? logos[v.logo_id] : undefined} onChange={(id) => set("logo_id", id)} />
            </div>
            <div className="md:col-span-2">
              <TextArea label="Summary" value={v.summary ?? ""} onChange={(x) => set("summary", x || null)} max={1000} rows={3} />
            </div>
            <div className="md:col-span-2">
              <TextArea
                label="Responsibilities and achievements (one per line)"
                value={v.bullets.join("\n")}
                onChange={(x) => set("bullets", x.split("\n"))}
                rows={6}
              />
            </div>
            <div className="md:col-span-2">
              <LinksEditor label="Links (e.g. project apps)" value={v.links} onChange={(x) => set("links", x)} />
            </div>
            <div className="space-y-3 md:col-span-2">
              <Toggle label="Flag for review (pending verification)" checked={v.needs_review} onChange={(x) => set("needs_review", x)} />
              {v.needs_review && <TextArea label="Review note" value={v.review_note ?? ""} onChange={(x) => set("review_note", x || null)} max={500} rows={2} />}
            </div>
          </div>
        );
      }}
    />
  );
}
