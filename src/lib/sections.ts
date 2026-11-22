/**
 * Section registry: one entry per section type. The admin builds its forms
 * from `fields`, and the public site picks a renderer by `type`.
 * Adding a section type = add it here + add a renderer in components/blocks.
 */

export type Field =
  | { key: string; label: string; type: "text"; max?: number; required?: boolean; help?: string }
  | { key: string; label: string; type: "textarea"; max?: number; help?: string }
  | { key: string; label: string; type: "richtext"; help?: string }
  | { key: string; label: string; type: "url"; help?: string }
  | { key: string; label: string; type: "media"; help?: string }
  | { key: string; label: string; type: "boolean"; help?: string }
  | { key: string; label: string; type: "number"; min?: number; max?: number; help?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; help?: string }
  | { key: string; label: string; type: "strings"; help?: string }
  | { key: string; label: string; type: "items"; fields: Field[]; itemLabel: string; help?: string };

export type SectionDef = {
  type: string;
  name: string;
  description: string;
  fields: Field[];
  defaults: Record<string, unknown>;
};

const link = (prefix: string, label: string): Field[] => [
  { key: `${prefix}_label`, label: `${label} label`, type: "text", max: 40 },
  { key: `${prefix}_url`, label: `${label} link`, type: "url" },
];

export const SECTION_DEFS: SectionDef[] = [
  {
    type: "hero",
    name: "Hero",
    description: "Large headline with buttons and an optional before/after image slider.",
    fields: [
      { key: "eyebrow", label: "Small label above the heading", type: "text", max: 60 },
      { key: "heading", label: "Heading", type: "text", max: 120, required: true },
      { key: "intro", label: "Introduction", type: "textarea", max: 400 },
      ...link("primary", "Primary button"),
      ...link("secondary", "Secondary button"),
      { key: "before_id", label: "Slider image: left (before)", type: "media" },
      { key: "before_label", label: "Left image label", type: "text", max: 30 },
      { key: "after_id", label: "Slider image: right (after)", type: "media" },
      { key: "after_label", label: "Right image label", type: "text", max: 30 },
    ],
    defaults: { heading: "New hero" },
  },
  {
    type: "page_header",
    name: "Page header",
    description: "Title block for inner pages, with an optional image.",
    fields: [
      { key: "eyebrow", label: "Small label", type: "text", max: 60 },
      { key: "heading", label: "Heading", type: "text", max: 140, required: true },
      { key: "intro", label: "Introduction", type: "textarea", max: 600 },
      { key: "tags", label: "Tags / roles shown as chips", type: "strings" },
      { key: "image_id", label: "Image", type: "media" },
    ],
    defaults: { heading: "Page title" },
  },
  {
    type: "intro_split",
    name: "Introduction with portrait",
    description: "Editorial block with text on one side and a portrait on the other.",
    fields: [
      { key: "eyebrow", label: "Small label", type: "text", max: 60 },
      { key: "heading", label: "Heading", type: "text", max: 120 },
      { key: "body", label: "Text", type: "richtext" },
      { key: "focus_areas", label: "Focus areas (chips)", type: "strings" },
      { key: "image_id", label: "Portrait", type: "media" },
      ...link("link", "Link"),
    ],
    defaults: {},
  },
  {
    type: "rich_text",
    name: "Rich text",
    description: "Free content: headings, lists, images, tables, videos, links.",
    fields: [
      { key: "heading", label: "Heading (optional)", type: "text", max: 120 },
      { key: "body", label: "Content", type: "richtext" },
      {
        key: "width",
        label: "Width",
        type: "select",
        options: [
          { value: "narrow", label: "Reading width" },
          { value: "wide", label: "Wide" },
        ],
      },
    ],
    defaults: { width: "narrow" },
  },
  {
    type: "marquee",
    name: "Toolkit strip",
    description: "A slowly scrolling strip of names (tools, technologies).",
    fields: [
      { key: "heading", label: "Heading (optional)", type: "text", max: 80 },
      { key: "items", label: "Items", type: "strings" },
    ],
    defaults: { items: [] },
  },
  {
    type: "timeline",
    name: "Timeline",
    description: "Milestones in order. Horizontal on desktop, vertical on mobile.",
    fields: [
      { key: "eyebrow", label: "Small label", type: "text", max: 60 },
      { key: "heading", label: "Heading", type: "text", max: 120 },
      { key: "intro", label: "Introduction", type: "textarea", max: 400 },
      {
        key: "items",
        label: "Milestones",
        type: "items",
        itemLabel: "Milestone",
        fields: [
          { key: "year", label: "Year or period", type: "text", max: 20 },
          { key: "title", label: "Title", type: "text", max: 120 },
          { key: "body", label: "Text", type: "textarea", max: 1200 },
          { key: "link_label", label: "Link label", type: "text", max: 60 },
          { key: "link_url", label: "Link", type: "url" },
        ],
      },
    ],
    defaults: { items: [] },
  },
  {
    type: "featured_projects",
    name: "Featured projects",
    description: "Bento grid of projects marked as featured.",
    fields: [
      { key: "eyebrow", label: "Small label", type: "text", max: 60 },
      { key: "heading", label: "Heading", type: "text", max: 120 },
      { key: "intro", label: "Introduction", type: "textarea", max: 400 },
      { key: "limit", label: "How many", type: "number", min: 1, max: 12 },
      ...link("link", "Link below grid"),
    ],
    defaults: { limit: 6 },
  },
  {
    type: "projects_grid",
    name: "All projects",
    description: "Every published project, filterable by category.",
    fields: [{ key: "heading", label: "Heading (optional)", type: "text", max: 120 }],
    defaults: {},
  },
  {
    type: "services_list",
    name: "Services",
    description: "Numbered list of services from the Services collection.",
    fields: [
      { key: "eyebrow", label: "Small label", type: "text", max: 60 },
      { key: "heading", label: "Heading", type: "text", max: 120 },
      { key: "intro", label: "Introduction", type: "textarea", max: 400 },
      { key: "home_only", label: "Only services marked 'Show on home'", type: "boolean" },
      { key: "show_details", label: "Show full details", type: "boolean" },
    ],
    defaults: { home_only: false, show_details: true },
  },
  {
    type: "skills",
    name: "Skills",
    description: "Skills grouped by category, with filter chips.",
    fields: [
      { key: "heading", label: "Heading (optional)", type: "text", max: 120 },
      { key: "intro", label: "Introduction", type: "textarea", max: 400 },
    ],
    defaults: {},
  },
  {
    type: "experience",
    name: "Work experience",
    description: "Roles from the Work Experience collection, newest first.",
    fields: [{ key: "heading", label: "Heading (optional)", type: "text", max: 120 }],
    defaults: {},
  },
  {
    type: "cards",
    name: "Cards",
    description: "A set of short items with an optional number, title and text.",
    fields: [
      { key: "eyebrow", label: "Small label", type: "text", max: 60 },
      { key: "heading", label: "Heading", type: "text", max: 120 },
      {
        key: "items",
        label: "Cards",
        type: "items",
        itemLabel: "Card",
        fields: [
          { key: "kicker", label: "Number or label", type: "text", max: 30 },
          { key: "title", label: "Title", type: "text", max: 120 },
          { key: "body", label: "Text", type: "textarea", max: 600 },
        ],
      },
    ],
    defaults: { items: [] },
  },
  {
    type: "quote",
    name: "Pull quote",
    description: "A large statement or mission quote.",
    fields: [
      { key: "text", label: "Quote", type: "textarea", max: 500 },
      { key: "attribution", label: "Attribution", type: "text", max: 120 },
    ],
    defaults: {},
  },
  {
    type: "stats",
    name: "Impact counters",
    description: "Numbers in a navy band. Keep hidden until figures are verified.",
    fields: [
      { key: "heading", label: "Heading", type: "text", max: 120 },
      {
        key: "items",
        label: "Counters",
        type: "items",
        itemLabel: "Counter",
        fields: [
          { key: "value", label: "Value (e.g. 20+)", type: "text", max: 12 },
          { key: "label", label: "Label", type: "text", max: 60 },
        ],
      },
    ],
    defaults: { items: [] },
  },
  {
    type: "testimonials",
    name: "Testimonials",
    description: "Quotes from people. Publish only genuine quotes with permission.",
    fields: [
      { key: "heading", label: "Heading", type: "text", max: 120 },
      {
        key: "items",
        label: "Testimonials",
        type: "items",
        itemLabel: "Testimonial",
        fields: [
          { key: "quote", label: "Quote", type: "textarea", max: 600 },
          { key: "name", label: "Name", type: "text", max: 80 },
          { key: "role", label: "Role", type: "text", max: 120 },
          { key: "permission", label: "Permission to publish obtained", type: "boolean" },
        ],
      },
    ],
    defaults: { items: [] },
  },
  {
    type: "cta",
    name: "Call to action",
    description: "Bold panel with one button.",
    fields: [
      { key: "heading", label: "Heading", type: "text", max: 120 },
      { key: "body", label: "Text", type: "textarea", max: 400 },
      ...link("button", "Button"),
      {
        key: "tone",
        label: "Colour",
        type: "select",
        options: [
          { value: "gold", label: "Gold" },
          { value: "navy", label: "Navy" },
        ],
      },
    ],
    defaults: { tone: "gold" },
  },
  {
    type: "contact_form",
    name: "Contact form",
    description: "The enquiry form. Submissions appear under Enquiries.",
    fields: [
      { key: "heading", label: "Heading", type: "text", max: 120 },
      { key: "intro", label: "Introduction", type: "textarea", max: 600 },
    ],
    defaults: {},
  },
  {
    type: "location",
    name: "Location and availability",
    description: "Locations, availability, email and map from Settings.",
    fields: [
      { key: "heading", label: "Heading", type: "text", max: 120 },
      { key: "show_map", label: "Show map", type: "boolean" },
    ],
    defaults: { show_map: true },
  },
  {
    type: "embed",
    name: "Embed",
    description: "Embed from an approved provider: Book Creator, YouTube, Google Maps.",
    fields: [
      { key: "heading", label: "Heading", type: "text", max: 120 },
      { key: "intro", label: "Introduction", type: "textarea", max: 400 },
      { key: "url", label: "Embed or share URL", type: "url" },
      { key: "title", label: "Accessible title", type: "text", max: 120 },
      { key: "height", label: "Height (px)", type: "number", min: 200, max: 1400 },
      { key: "show_link", label: "Also show an 'Open in new tab' link", type: "boolean" },
    ],
    defaults: { height: 720, show_link: true },
  },
  {
    type: "link_groups",
    name: "Link groups",
    description: "Grouped lists of links, e.g. resources and tools.",
    fields: [
      { key: "eyebrow", label: "Small label", type: "text", max: 60 },
      { key: "heading", label: "Heading", type: "text", max: 120 },
      { key: "intro", label: "Introduction", type: "textarea", max: 400 },
      {
        key: "groups",
        label: "Groups",
        type: "items",
        itemLabel: "Group",
        fields: [
          { key: "title", label: "Group title", type: "text", max: 80 },
          {
            key: "links",
            label: "Links",
            type: "items",
            itemLabel: "Link",
            fields: [
              { key: "label", label: "Label", type: "text", max: 80 },
              { key: "url", label: "URL", type: "url" },
              { key: "description", label: "Description", type: "text", max: 200 },
            ],
          },
        ],
      },
    ],
    defaults: { groups: [] },
  },
  {
    type: "image",
    name: "Image",
    description: "A single image with an optional caption.",
    fields: [
      { key: "media_id", label: "Image", type: "media" },
      { key: "caption", label: "Caption", type: "text", max: 200 },
      {
        key: "size",
        label: "Size",
        type: "select",
        options: [
          { value: "narrow", label: "Reading width" },
          { value: "wide", label: "Wide" },
        ],
      },
    ],
    defaults: { size: "wide" },
  },
];

export const SECTION_BY_TYPE = Object.fromEntries(SECTION_DEFS.map((d) => [d.type, d]));

/** Allowed embed hosts and converter from share URLs to embeddable URLs. */
export function toEmbedUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
    const id = host === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v") ?? u.pathname.split("/").pop();
    return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "read.bookcreator.com") return u.toString();
  if (host === "google.com" && u.pathname.startsWith("/maps/embed")) return u.toString();
  return null;
}
