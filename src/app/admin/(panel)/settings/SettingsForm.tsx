"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Save, Trash2 } from "@/components/icons";
import { saveSettings } from "@/app/admin/actions/site";
import type { SiteSettings } from "@/lib/settings";
import { MediaPickerModal } from "@/components/admin/MediaPicker";
import { Button, Card, Field, PageHeading, Select, StringList, TextArea, TextInput, Toggle, inputCls, useToast, useUnsavedWarning } from "@/components/admin/ui";

function ImageUrlField({ label, value, onChange, help, dark }: { label: string; value: string; onChange: (v: string) => void; help?: string; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label} help={help}>
      <div className="flex items-center gap-3">
        <div className={`grid h-16 min-w-16 place-items-center rounded-xl border border-line p-2 ${dark ? "bg-navy" : "bg-bg-alt"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="max-h-12 w-auto" /> : <span className="text-xs text-muted">None</span>}
        </div>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Choose from library
        </Button>
      </div>
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder="or paste an https:// image URL" aria-label={`${label} URL`} />
      <MediaPickerModal open={open} onClose={() => setOpen(false)} onPick={(m) => onChange(m.url.split("?")[0])} />
    </Field>
  );
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useUnsavedWarning(dirty);
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => {
    setS((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };
  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const save = async () => {
    setSaving(true);
    const r = await saveSettings(s);
    setSaving(false);
    if (!r.ok) return toast("error", r.error);
    setDirty(false);
    toast("ok", "Settings saved. The website is updated.");
    router.refresh();
  };

  return (
    <>
      <PageHeading
        title="Settings"
        description="Branding, contact details, footer and search engine defaults."
        actions={
          <Button onClick={save} disabled={saving || !dirty}>
            <Save size={16} /> {saving ? "Saving…" : "Save settings"}
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Identity & logo">
          <TextInput label="Site name" value={s.site_name} onChange={(v) => set("site_name", v)} max={80} />
          <TextInput label="Owner name" value={s.owner_name} onChange={(v) => set("owner_name", v)} max={80} />
          <ImageUrlField label="Logo" value={s.logo_url} onChange={(v) => set("logo_url", v)} dark />
          <TextInput label="Logo alt text" value={s.logo_alt} onChange={(v) => set("logo_alt", v)} max={120} />
          <Toggle label="Show logo on a navy badge in the header" checked={s.logo_on_navy_badge} onChange={(v) => set("logo_on_navy_badge", v)} help="Keeps a gold logo readable in light mode." />
          <ImageUrlField label="Favicon" value={s.favicon_url} onChange={(v) => set("favicon_url", v)} help="Square PNG, at least 192 × 192 px." />
        </Card>
        <Card title="Brand & appearance">
          <div className="grid grid-cols-2 gap-4">
            {(["brand_navy", "brand_gold"] as const).map((k) => (
              <Field key={k} label={k === "brand_navy" ? "Primary navy" : "Primary gold"}>
                <div className="flex items-center gap-2">
                  <input type="color" value={s[k]} onChange={(e) => set(k, e.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded border border-line" aria-label={`${k} colour picker`} />
                  <input className={inputCls} value={s[k]} onChange={(e) => set(k, e.target.value)} aria-label={`${k} hex value`} />
                </div>
              </Field>
            ))}
          </div>
          <p className="text-xs text-muted">Official KTM EduTech colours: Navy #232450, Gold #FEDC69. Changing them affects the whole site.</p>
          <Select label="Font" value={s.font_family} onChange={(v) => set("font_family", v as SiteSettings["font_family"])} options={[{ value: "Poppins", label: "Poppins (self-hosted)" }]} />
          <Select
            label="Default theme for first-time visitors"
            value={s.default_theme}
            onChange={(v) => set("default_theme", v as SiteSettings["default_theme"])}
            options={[
              { value: "light", label: "Light (recommended)" },
              { value: "dark", label: "Dark" },
            ]}
            help="Visitors can switch with the toggle; their choice is remembered."
          />
        </Card>
        <Card title="Contact & location">
          <TextInput label="Public email" type="email" value={s.email} onChange={(v) => set("email", v)} />
          <TextInput label="Main base (primary location)" value={s.primary_location_label} onChange={(v) => set("primary_location_label", v)} max={120} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Map latitude">
              <input className={inputCls} value={s.primary_location_lat ?? ""} onChange={(e) => set("primary_location_lat", num(e.target.value))} inputMode="decimal" />
            </Field>
            <Field label="Map longitude">
              <input className={inputCls} value={s.primary_location_lng ?? ""} onChange={(e) => set("primary_location_lng", num(e.target.value))} inputMode="decimal" />
            </Field>
          </div>
          <TextInput label="Google Maps search name" value={s.map_query} onChange={(v) => set("map_query", v)} help="Used for the 'Open in Maps' link." />
          <TextInput label="Current location" value={s.current_location_label} onChange={(v) => set("current_location_label", v)} max={120} />
          <TextInput label="Availability statement" value={s.availability} onChange={(v) => set("availability", v)} max={200} />
          <StringList label="Contact form enquiry types" value={s.enquiry_types} onChange={(v) => set("enquiry_types", v)} />
          <TextInput label="Privacy Policy URL" value={s.privacy_policy_url} onChange={(v) => set("privacy_policy_url", v)} help="Linked from the contact form's consent tick box." />
        </Card>
        <Card title="Header & footer">
          <TextArea label="Footer description" value={s.footer_description} onChange={(v) => set("footer_description", v)} max={500} rows={3} />
          <TextInput label="Footer tagline" value={s.footer_tagline} onChange={(v) => set("footer_tagline", v)} max={200} />
          <TextInput label="Copyright text" value={s.copyright} onChange={(v) => set("copyright", v)} max={200} />
          <Field label="Social media links">
            <ul className="space-y-2">
              {s.social.map((so, i) => (
                <li key={i} className="flex gap-2">
                  <input className={`${inputCls} max-w-[9rem]`} value={so.platform} onChange={(e) => set("social", s.social.map((x, j) => (j === i ? { ...x, platform: e.target.value } : x)))} aria-label="Platform" placeholder="Platform" />
                  <input className={inputCls} value={so.url} onChange={(e) => set("social", s.social.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} aria-label="URL" placeholder="https://…" />
                  <button className="rounded-lg p-2 text-red-700 hover:bg-red-50" onClick={() => set("social", s.social.filter((_, j) => j !== i))} aria-label={`Remove ${so.platform}`}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <Button variant="secondary" size="sm" onClick={() => set("social", [...s.social, { platform: "", url: "" }])}>
              <Plus size={15} /> Add social link
            </Button>
          </Field>
          <p className="text-xs text-muted">Header and footer links are edited under Navigation.</p>
        </Card>
        <Card title="Search engines (defaults)">
          <TextInput label="Default title (homepage)" value={s.seo_default_title} onChange={(v) => set("seo_default_title", v)} max={70} />
          <TextInput label="Title template" value={s.seo_title_template} onChange={(v) => set("seo_title_template", v)} help="%s is replaced by the page title, e.g. “%s | KTM EduTech”." />
          <TextArea label="Default meta description" value={s.seo_default_description} onChange={(v) => set("seo_default_description", v)} max={200} rows={3} />
          <ImageUrlField label="Default social sharing image" value={s.seo_og_image_url} onChange={(v) => set("seo_og_image_url", v)} />
        </Card>
        <Card title="Blog">
          <Toggle label="Blog enabled (public)" checked={s.blog_enabled} onChange={(v) => set("blog_enabled", v)} help="While off, /blog is hidden from visitors and search engines. You can still write and preview posts." />
        </Card>
      </div>
    </>
  );
}
