"use client";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { Field } from "@/lib/sections";
import { MediaField } from "./MediaPicker";
import { RichTextEditor } from "./RichTextEditor";
import { Button, Select, StringList, TextArea, TextInput, Toggle, Field as FieldWrap, inputCls } from "./ui";

type Data = Record<string, unknown>;

/** Renders an editable form for a list of field definitions (used by page sections). */
export function AutoForm({ fields, value, onChange, mediaUrls }: { fields: Field[]; value: Data; onChange: (v: Data) => void; mediaUrls: Record<string, string> }) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <FieldInput key={f.key} field={f} value={value[f.key]} onChange={(v) => set(f.key, v)} mediaUrls={mediaUrls} />
      ))}
    </div>
  );
}

function FieldInput({ field: f, value, onChange, mediaUrls }: { field: Field; value: unknown; onChange: (v: unknown) => void; mediaUrls: Record<string, string> }) {
  switch (f.type) {
    case "text":
      return <TextInput label={f.label} value={(value as string) ?? ""} onChange={onChange} max={f.max} help={f.help} required={f.required} />;
    case "url":
      return <TextInput label={f.label} value={(value as string) ?? ""} onChange={onChange} help={f.help ?? "A page path like /contact-us, or a full https:// address"} />;
    case "textarea":
      return <TextArea label={f.label} value={(value as string) ?? ""} onChange={onChange} max={f.max} help={f.help ?? "Leave a blank line between paragraphs."} />;
    case "richtext":
      return <RichTextEditor label={f.label} value={value} onChange={onChange} help={f.help} />;
    case "media":
      return <MediaField label={f.label} value={(value as string) ?? null} onChange={(id) => onChange(id)} preview={value ? mediaUrls[value as string] : undefined} help={f.help} />;
    case "boolean":
      return <Toggle label={f.label} checked={Boolean(value)} onChange={onChange} help={f.help} />;
    case "number":
      return (
        <FieldWrap label={f.label} help={f.help}>
          <input
            type="number"
            min={f.min}
            max={f.max}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            className={inputCls}
          />
        </FieldWrap>
      );
    case "select":
      return <Select label={f.label} value={(value as string) ?? f.options[0].value} onChange={onChange} options={f.options} help={f.help} />;
    case "strings":
      return <StringList label={f.label} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} help={f.help} />;
    case "items":
      return <ItemsField field={f} value={Array.isArray(value) ? (value as Data[]) : []} onChange={onChange} mediaUrls={mediaUrls} />;
  }
}

function ItemsField({ field, value, onChange, mediaUrls }: { field: Extract<Field, { type: "items" }>; value: Data[]; onChange: (v: Data[]) => void; mediaUrls: Record<string, string> }) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <FieldWrap label={field.label} help={field.help}>
      <ol className="space-y-3">
        {value.map((item, i) => (
          <li key={i} className="rounded-xl border border-line bg-bg/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">
                {field.itemLabel} {i + 1}
              </span>
              <div className="flex gap-1">
                <button type="button" className="rounded p-1 hover:bg-bg-alt disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  <ChevronUp size={16} />
                </button>
                <button type="button" className="rounded p-1 hover:bg-bg-alt disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move down">
                  <ChevronDown size={16} />
                </button>
                <button type="button" className="rounded p-1 text-red-700 hover:bg-red-50" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${field.itemLabel} ${i + 1}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <AutoForm fields={field.fields} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} mediaUrls={mediaUrls} />
          </li>
        ))}
      </ol>
      <Button variant="secondary" size="sm" onClick={() => onChange([...value, {}])}>
        <Plus size={15} /> Add {field.itemLabel.toLowerCase()}
      </Button>
    </FieldWrap>
  );
}
