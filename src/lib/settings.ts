import { z } from "zod";

const url = z.string().trim().url().or(z.literal(""));

export const settingsSchema = z.object({
  site_name: z.string().trim().min(1).max(80).default("KTM EduTech"),
  owner_name: z.string().trim().max(80).default("Kyd Tantano Masong"),
  tagline: z.string().trim().max(200).default(""),
  logo_url: url.default(""),
  logo_alt: z.string().trim().max(120).default("KTM EduTech"),
  logo_on_navy_badge: z.boolean().default(true),
  favicon_url: url.default(""),
  brand_navy: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#232450"),
  brand_gold: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#FEDC69"),
  font_family: z.enum(["Poppins"]).default("Poppins"),
  default_theme: z.enum(["light", "dark"]).default("light"),
  header_cta_label: z.string().trim().max(40).default("Contact"),
  header_cta_url: z.string().trim().max(300).default("/contact-us"),
  footer_description: z.string().trim().max(500).default(""),
  footer_tagline: z.string().trim().max(200).default(""),
  copyright: z.string().trim().max(200).default(""),
  email: z.string().trim().email().or(z.literal("")).default(""),
  availability: z.string().trim().max(200).default(""),
  primary_location_label: z.string().trim().max(120).default(""),
  primary_location_lat: z.number().min(-90).max(90).nullable().default(null),
  primary_location_lng: z.number().min(-180).max(180).nullable().default(null),
  map_query: z.string().trim().max(200).default(""),
  current_location_label: z.string().trim().max(120).default(""),
  social: z
    .array(z.object({ platform: z.string().trim().min(1).max(30), url: z.string().trim().url() }))
    .max(12)
    .default([]),
  seo_title_template: z.string().trim().max(80).default("%s | KTM EduTech"),
  seo_default_title: z.string().trim().max(70).default("KTM EduTech"),
  seo_default_description: z.string().trim().max(200).default(""),
  seo_og_image_url: url.default(""),
  blog_enabled: z.boolean().default(false),
  enquiry_types: z.array(z.string().trim().min(1).max(60)).min(1).max(12).default(["General enquiry"]),
  privacy_policy_url: z.string().trim().max(300).default(""),
});

export type SiteSettings = z.infer<typeof settingsSchema>;

/** Field-by-field parse: one bad value falls back to its default without losing the rest. */
export function parseSettings(raw: unknown): SiteSettings {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(settingsSchema.shape)) {
    const result = (schema as z.ZodType).safeParse(obj[key]);
    out[key] = result.success ? result.data : (schema as z.ZodType).parse(undefined);
  }
  return out as SiteSettings;
}
