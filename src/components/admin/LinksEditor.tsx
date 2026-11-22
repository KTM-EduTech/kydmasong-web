"use client";
import { Plus, Trash2 } from "lucide-react";
import type { LinkItem } from "@/lib/types";
import { Button, Field, inputCls } from "./ui";

export function LinksEditor({ label, value, onChange, help }: { label: string; value: LinkItem[]; onChange: (v: LinkItem[]) => void; help?: string }) {
  return (
    <Field label={label} help={help}>
      <ul className="space-y-2">
        {value.map((l, i) => (
          <li key={i} className="flex gap-2">
            <input aria-label="Link label" placeholder="Label" value={l.label} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={`${inputCls} max-w-[12rem]`} />
            <input aria-label="Link URL" placeholder="https://…" value={l.url} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} className={inputCls} />
            <button type="button" className="rounded-lg p-2 text-red-700 hover:bg-red-50" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove link ${i + 1}`}>
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" onClick={() => onChange([...value, { label: "", url: "" }])}>
        <Plus size={15} /> Add link
      </Button>
    </Field>
  );
}
