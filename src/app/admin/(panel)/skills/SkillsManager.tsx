"use client";
import { deleteSkill, reorderSkills, saveSkill } from "@/app/admin/actions/content";
import type { Skill } from "@/lib/types";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { Field, Select, TextArea, TextInput, inputCls } from "@/components/admin/ui";

type S = Omit<Skill, "id">;

export function SkillsManager({ items }: { items: Skill[] }) {
  const categories = [...new Set(items.map((s) => s.category))];
  return (
    <CollectionManager<Skill>
      title="Skills"
      description="Grouped by category on the Skills page. No percentage ratings are shown."
      items={items}
      blank={{ name: "", category: categories[0] ?? "", description: null, url: null, sort_order: 0, status: "published" }}
      itemTitle={(s) => s.name || "New skill"}
      itemSubtitle={(s) => s.description ?? ""}
      groupBy={(s) => s.category}
      onSave={(id, v) => saveSkill(id, { name: v.name, category: v.category, description: v.description, url: v.url, status: v.status })}
      onDelete={deleteSkill}
      onReorder={reorderSkills}
      Form={({ value: v, onChange }) => {
        const set = <K extends keyof S>(k: K, val: S[K]) => onChange({ ...v, [k]: val });
        return (
          <div className="space-y-4">
            <TextInput label="Name" value={v.name} onChange={(x) => set("name", x)} required max={80} />
            <Field label="Category" help="Pick an existing category or type a new one.">
              <input list="skill-cats" className={inputCls} value={v.category} onChange={(e) => set("category", e.target.value)} />
              <datalist id="skill-cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <TextArea label="Description" value={v.description ?? ""} onChange={(x) => set("description", x || null)} max={300} rows={2} />
            <TextInput label="Link (optional)" value={v.url ?? ""} onChange={(x) => set("url", x || null)} />
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
