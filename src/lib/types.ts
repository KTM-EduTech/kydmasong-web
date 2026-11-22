export type Status = "draft" | "published";

export type Media = {
  id: string;
  folder_id: string | null;
  storage_path: string | null;
  external_url: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
};

export type Page = {
  id: string;
  title: string;
  slug: string;
  status: Status;
  parent_id: string | null;
  sort_order: number;
  show_in_sitemap: boolean;
  needs_review: boolean;
  review_note: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_id: string | null;
  canonical_url: string | null;
  noindex: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Section = {
  id: string;
  page_id: string;
  type: string;
  label: string | null;
  data: Record<string, unknown>;
  position: number;
  visible: boolean;
  needs_review: boolean;
  review_note: string | null;
};

export type NavItem = {
  id: string;
  menu: string;
  parent_id: string | null;
  label: string;
  page_id: string | null;
  url: string | null;
  open_in_new_tab: boolean;
  is_button: boolean;
  enabled: boolean;
  position: number;
};

export type ResolvedNavItem = NavItem & { href: string; children: ResolvedNavItem[] };

export type LinkItem = { label: string; url: string };

export type Project = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: unknown;
  cover_id: string | null;
  gallery_ids: string[];
  links: LinkItem[];
  category_id: string | null;
  featured: boolean;
  featured_order: number;
  sort_order: number;
  status: Status;
  needs_review: boolean;
  review_note: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: unknown;
  featured_image_id: string | null;
  category_id: string | null;
  status: Status;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = { id: string; scope: "project" | "article"; name: string; slug: string; sort_order: number };
export type Tag = { id: string; scope: "project" | "article"; name: string; slug: string };

export type Experience = {
  id: string;
  role: string;
  organization: string;
  organization_url: string | null;
  location: string | null;
  start_label: string | null;
  end_label: string | null;
  sort_date: string | null;
  logo_id: string | null;
  summary: string | null;
  bullets: string[];
  links: LinkItem[];
  status: Status;
  needs_review: boolean;
  review_note: string | null;
  sort_order: number;
};

export type Skill = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  url: string | null;
  sort_order: number;
  status: Status;
};

export type Service = {
  id: string;
  title: string;
  summary: string | null;
  details: string | null;
  image_id: string | null;
  cta_label: string | null;
  cta_url: string | null;
  show_on_home: boolean;
  sort_order: number;
  status: Status;
};

export type ContactSubmission = {
  id: string;
  full_name: string;
  email: string;
  enquiry_type: string;
  subject: string | null;
  message: string;
  consent: boolean;
  status: "new" | "read" | "archived";
  created_at: string;
};

export type Redirect = { id: string; source: string; destination: string; status_code: number; enabled: boolean };
