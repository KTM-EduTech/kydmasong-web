"use client";
import { deleteService, reorderServices, saveService } from "@/app/admin/actions/content";
import type { Service } from "@/lib/types";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { MediaField } from "@/components/admin/MediaPicker";
import { Select, TextArea, TextInput, Toggle } from "@/components/admin/ui";

type S = Omit<Service, "id">;

export function ServicesManager({ items, images }: { items: Service[]; images: Record<string, string> }) {
  return (
    <CollectionManager<Service>
      title="Services"
      description="Services listed on the Services page (and on the homepage if marked)."
      items={items}
      blank={{ title: "", summary: null, details: null, image_id: null, cta_label: null, cta_url: null, show_on_home: false, sort_order: 0, status: "published" }}
      itemTitle={(s) => s.title || "New service"}
      itemSubtitle={(s) => (s.show_on_home ? "Shown on homepage · " : "") + (s.summary ?? "")}
      onSave={(id, v) =>
        saveService(id, {
          title: v.title,
          summary: v.summary,
          details: v.details,
          image_id: v.image_id,
          cta_label: v.cta_label,
          cta_url: v.cta_url,
          show_on_home: v.show_on_home,
          status: v.status,
        })
      }
      onDelete={deleteService}
      onReorder={reorderServices}
      Form={({ value: v, onChange }) => {
        const set = <K extends keyof S>(k: K, val: S[K]) => onChange({ ...v, [k]: val });
        return (
          <div className="space-y-4">
            <TextInput label="Title" value={v.title} onChange={(x) => set("title", x)} required max={120} />
            <TextArea label="Short summary" value={v.summary ?? ""} onChange={(x) => set("summary", x || null)} max={400} rows={2} />
            <TextArea label="Details" value={v.details ?? ""} onChange={(x) => set("details", x || null)} max={3000} rows={5} help="Leave a blank line between paragraphs." />
            <MediaField label="Image" value={v.image_id} preview={v.image_id ? images[v.image_id] : undefined} onChange={(id) => set("image_id", id)} />
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Button label" value={v.cta_label ?? ""} onChange={(x) => set("cta_label", x || null)} max={40} />
              <TextInput label="Button link" value={v.cta_url ?? ""} onChange={(x) => set("cta_url", x || null)} help="e.g. /contact-us or mailto:contact@kydmasong.net" />
            </div>
            <Toggle label="Show on homepage" checked={v.show_on_home} onChange={(x) => set("show_on_home", x)} />
            <Select
              label="Status"
              value={v.status}
              onChange={(x) => set("status", x as S["status"])}
              options={[
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft (hidden)" },
              ]}
            />
          </div>
        );
      }}
    />
  );
}
