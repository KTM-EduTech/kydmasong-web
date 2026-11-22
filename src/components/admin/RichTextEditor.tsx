"use client";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  StickyNote,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
  Video as YoutubeIcon,
} from "lucide-react";
import clsx from "clsx";
import { richTextExtensions } from "@/lib/richtext/extensions";
import { MediaPickerModal } from "./MediaPicker";
import { Button, Field, Modal, Select, TextInput, inputCls } from "./ui";
import { useAdminData } from "./AdminData";

type Props = { label: string; value: unknown; onChange: (json: unknown) => void; help?: string };

function Tool({ on, active, label, children, disabled }: { on: () => void; active?: boolean; label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={clsx("rounded-md p-1.5 transition disabled:opacity-40", active ? "bg-navy text-white" : "text-ink hover:bg-bg-alt")}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ label, value, onChange, help }: Props) {
  const [imgOpen, setImgOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const editor = useEditor({
    extensions: richTextExtensions(),
    content: (value as object) ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rt min-h-[14rem] max-w-none px-4 py-3 focus:outline-none",
        "aria-label": label,
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? null : editor.getJSON()),
  });

  // Keep external resets (e.g. loading another record) in sync.
  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(value ?? { type: "doc", content: [{ type: "paragraph" }] });
    if (value && current !== incoming) editor.commands.setContent(value as object, { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return <Field label={label}><div className="min-h-[14rem] rounded-xl border border-line" /></Field>;

  const imageSelected = editor.isActive("image");
  return (
    <Field label={label} help={help}>
      <div className="overflow-hidden rounded-xl border border-line bg-surface focus-within:border-navy focus-within:ring-2 focus-within:ring-gold/70">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-surface px-2 py-1.5" role="toolbar" aria-label={`${label} formatting`}>
          <Tool label="Heading 2" active={editor.isActive("heading", { level: 2 })} on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={17} />
          </Tool>
          <Tool label="Heading 3" active={editor.isActive("heading", { level: 3 })} on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={17} />
          </Tool>
          <span className="mx-1 h-5 w-px bg-line" />
          <Tool label="Bold" active={editor.isActive("bold")} on={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={17} />
          </Tool>
          <Tool label="Italic" active={editor.isActive("italic")} on={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={17} />
          </Tool>
          <Tool label="Underline" active={editor.isActive("underline")} on={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={17} />
          </Tool>
          <span className="mx-1 h-5 w-px bg-line" />
          <Tool label="Bulleted list" active={editor.isActive("bulletList")} on={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={17} />
          </Tool>
          <Tool label="Numbered list" active={editor.isActive("orderedList")} on={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={17} />
          </Tool>
          <Tool label="Quote" active={editor.isActive("blockquote")} on={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote size={17} />
          </Tool>
          <Tool label="Callout block" active={editor.isActive("callout")} on={() => editor.chain().focus().toggleWrap("callout").run()}>
            <StickyNote size={17} />
          </Tool>
          <Tool label="Divider" on={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={17} />
          </Tool>
          <span className="mx-1 h-5 w-px bg-line" />
          <Tool label="Align left" active={imageSelected ? editor.getAttributes("image").align === "left" : editor.isActive({ textAlign: "left" })} on={() => (imageSelected ? editor.chain().focus().updateAttributes("image", { align: "left" }).run() : editor.chain().focus().setTextAlign("left").run())}>
            <AlignLeft size={17} />
          </Tool>
          <Tool label="Align centre" active={imageSelected ? editor.getAttributes("image").align === "center" : editor.isActive({ textAlign: "center" })} on={() => (imageSelected ? editor.chain().focus().updateAttributes("image", { align: "center" }).run() : editor.chain().focus().setTextAlign("center").run())}>
            <AlignCenter size={17} />
          </Tool>
          <Tool label="Align right" active={imageSelected ? editor.getAttributes("image").align === "right" : editor.isActive({ textAlign: "right" })} on={() => (imageSelected ? editor.chain().focus().updateAttributes("image", { align: "right" }).run() : editor.chain().focus().setTextAlign("right").run())}>
            <AlignRight size={17} />
          </Tool>
          <span className="mx-1 h-5 w-px bg-line" />
          <Tool label="Add or edit link" active={editor.isActive("link")} on={() => setLinkOpen(true)}>
            <Link2 size={17} />
          </Tool>
          <Tool label="Remove link" disabled={!editor.isActive("link")} on={() => editor.chain().focus().unsetLink().run()}>
            <Unlink size={17} />
          </Tool>
          <Tool label="Insert image" on={() => setImgOpen(true)}>
            <ImageIcon size={17} />
          </Tool>
          <Tool label="Embed YouTube video" on={() => setVideoOpen(true)}>
            <YoutubeIcon size={17} />
          </Tool>
          <Tool label="Insert table" on={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon size={17} />
          </Tool>
          <span className="mx-1 h-5 w-px bg-line" />
          <Tool label="Undo" on={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo2 size={17} />
          </Tool>
          <Tool label="Redo" on={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo2 size={17} />
          </Tool>
        </div>
        {editor.isActive("table") && <TableTools editor={editor} />}
        {imageSelected && <ImageTools editor={editor} />}
        <EditorContent editor={editor} />
      </div>
      <MediaPickerModal
        open={imgOpen}
        onClose={() => setImgOpen(false)}
        onPick={(m) => editor.chain().focus().setImage({ src: m.url.split("?")[0], alt: m.alt, title: m.caption ?? undefined }).run()}
      />
      <LinkDialog open={linkOpen} onClose={() => setLinkOpen(false)} editor={editor} />
      <VideoDialog open={videoOpen} onClose={() => setVideoOpen(false)} editor={editor} />
    </Field>
  );
}

function TableTools({ editor }: { editor: Editor }) {
  const b = "rounded-md border border-line px-2 py-1 text-xs font-medium hover:bg-bg-alt";
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-line bg-bg-alt/60 px-3 py-2">
      <button type="button" className={b} onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</button>
      <button type="button" className={b} onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Column</button>
      <button type="button" className={b} onClick={() => editor.chain().focus().deleteRow().run()}>− Row</button>
      <button type="button" className={b} onClick={() => editor.chain().focus().deleteColumn().run()}>− Column</button>
      <button type="button" className={b} onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Header row</button>
      <button type="button" className={`${b} text-red-700`} onClick={() => editor.chain().focus().deleteTable().run()}>Delete table</button>
    </div>
  );
}

function ImageTools({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes("image");
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line bg-bg-alt/60 px-3 py-2 text-sm">
      <label className="flex flex-1 items-center gap-2">
        <span className="font-medium">Alt text</span>
        <input
          className={`${inputCls} py-1`}
          value={attrs.alt ?? ""}
          onChange={(e) => editor.chain().updateAttributes("image", { alt: e.target.value }).run()}
          placeholder="Describe the image for screen readers"
        />
      </label>
      <button
        type="button"
        className="rounded-md border border-line px-2 py-1 text-xs font-medium hover:bg-bg-alt"
        onClick={() => editor.chain().focus().updateAttributes("image", { align: "full" }).run()}
      >
        Full width
      </button>
    </div>
  );
}

function LinkDialog({ open, onClose, editor }: { open: boolean; onClose: () => void; editor: Editor }) {
  return (
    <Modal open={open} onClose={onClose} title="Link">
      {open && <LinkForm onClose={onClose} editor={editor} />}
    </Modal>
  );
}

function LinkForm({ onClose, editor }: { onClose: () => void; editor: Editor }) {
  const { pages } = useAdminData();
  const href0 = (editor.getAttributes("link").href as string) ?? "";
  const internal0 = pages.find((p) => (p.slug === "home" ? "/" : `/${p.slug}`) === href0);
  const [kind, setKind] = useState<"page" | "url">(href0 && !internal0 ? "url" : "page");
  const [url, setUrl] = useState(internal0 ? "" : href0);
  const [page, setPage] = useState(internal0 ? internal0.slug : pages[0]?.slug ?? "");
  const apply = () => {
    const href = kind === "page" ? (page === "home" ? "/" : `/${page}`) : url.trim();
    if (!href) return;
    if (kind === "url" && !/^(https?:\/\/|mailto:|tel:|\/|#)/.test(href)) return alert("Links must start with https://, mailto:, tel: or /");
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    onClose();
  };
  return (
      <div className="space-y-4">
        <Select
          label="Link to"
          value={kind}
          onChange={(v) => setKind(v as "page" | "url")}
          options={[
            { value: "page", label: "A page on this site" },
            { value: "url", label: "Another website, email or path" },
          ]}
        />
        {kind === "page" ? (
          <Select label="Page" value={page} onChange={setPage} options={pages.map((p) => ({ value: p.slug, label: `${p.title} (/${p.slug === "home" ? "" : p.slug})` }))} />
        ) : (
          <TextInput label="URL" value={url} onChange={setUrl} placeholder="https://…" help="External links open in a new tab automatically." />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={apply}>Apply link</Button>
        </div>
      </div>
  );
}

function VideoDialog({ open, onClose, editor }: { open: boolean; onClose: () => void; editor: Editor }) {
  const [url, setUrl] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Embed a YouTube video">
      <div className="space-y-4">
        <TextInput label="YouTube URL" value={url} onChange={setUrl} placeholder="https://www.youtube.com/watch?v=…" />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              if (url.trim()) editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
              setUrl("");
              onClose();
            }}
          >
            Embed
          </Button>
        </div>
      </div>
    </Modal>
  );
}
