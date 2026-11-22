-- KTM EduTech CMS: core schema
-- Every table has Row Level Security enabled. Public (anon) users can only
-- read published content and insert contact submissions. All writes need
-- public.is_admin() = true.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'none' check (role in ('none', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent API users other than an existing admin from changing roles.
-- (SECURITY INVOKER on purpose: current_user is then the caller's role, so the
-- SQL editor / service role used for the one-time admin grant is allowed.)
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'Only an administrator can change roles';
  end if;
  return new;
end $$;

create trigger guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------------------------------------------------------------------------
-- Media library
-- ---------------------------------------------------------------------------
create table public.media_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.media_folders (id) on delete set null,
  storage_path text unique,
  external_url text,
  file_name text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint,
  width int,
  height int,
  alt text not null default '',
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_has_source check (storage_path is not null or external_url is not null)
);
create index media_folder_idx on public.media (folder_id);
create trigger media_updated before update on public.media
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Taxonomies
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('project', 'article')),
  name text not null check (length(name) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order int not null default 0,
  unique (scope, slug)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('project', 'article')),
  name text not null check (length(name) between 1 and 60),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  unique (scope, slug)
);

-- ---------------------------------------------------------------------------
-- Pages and their sections (the homepage is the page with slug 'home')
-- ---------------------------------------------------------------------------
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  parent_id uuid references public.pages (id) on delete set null,
  sort_order int not null default 0,
  show_in_sitemap boolean not null default true,
  needs_review boolean not null default false,
  review_note text,
  seo_title text check (seo_title is null or length(seo_title) <= 70),
  seo_description text check (seo_description is null or length(seo_description) <= 200),
  og_image_id uuid references public.media (id) on delete set null,
  canonical_url text,
  noindex boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
create index pages_parent_idx on public.pages (parent_id);
create index pages_og_idx on public.pages (og_image_id);
create index pages_updated_by_idx on public.pages (updated_by);
create trigger pages_updated before update on public.pages
  for each row execute function public.set_updated_at();

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  type text not null,
  label text,
  data jsonb not null default '{}'::jsonb,
  position int not null default 0,
  visible boolean not null default true,
  needs_review boolean not null default false,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index page_sections_page_idx on public.page_sections (page_id, position);
create trigger page_sections_updated before update on public.page_sections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Navigation
-- ---------------------------------------------------------------------------
create table public.nav_items (
  id uuid primary key default gen_random_uuid(),
  menu text not null check (menu in ('header', 'footer_resources', 'footer_quick_links', 'footer_tools', 'footer_legal')),
  parent_id uuid references public.nav_items (id) on delete cascade,
  label text not null check (length(label) between 1 and 80),
  page_id uuid references public.pages (id) on delete set null,
  url text,
  open_in_new_tab boolean not null default false,
  is_button boolean not null default false,
  enabled boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint nav_has_target check (page_id is not null or url is not null)
);
create index nav_items_menu_idx on public.nav_items (menu, position);
create index nav_items_parent_idx on public.nav_items (parent_id);
create index nav_items_page_idx on public.nav_items (page_id);

-- ---------------------------------------------------------------------------
-- Portfolio projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text,
  body jsonb,
  cover_id uuid references public.media (id) on delete set null,
  gallery_ids uuid[] not null default '{}',
  links jsonb not null default '[]'::jsonb,
  category_id uuid references public.categories (id) on delete set null,
  featured boolean not null default false,
  featured_order int not null default 0,
  sort_order int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  needs_review boolean not null default false,
  review_note text,
  seo_title text check (seo_title is null or length(seo_title) <= 70),
  seo_description text check (seo_description is null or length(seo_description) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_cover_idx on public.projects (cover_id);
create index projects_category_idx on public.projects (category_id);
create trigger projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_tags (
  project_id uuid not null references public.projects (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (project_id, tag_id)
);
create index project_tags_tag_idx on public.project_tags (tag_id);

-- ---------------------------------------------------------------------------
-- Blog
-- ---------------------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text,
  body jsonb,
  featured_image_id uuid references public.media (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  seo_title text check (seo_title is null or length(seo_title) <= 70),
  seo_description text check (seo_description is null or length(seo_description) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index articles_image_idx on public.articles (featured_image_id);
create index articles_category_idx on public.articles (category_id);
create trigger articles_updated before update on public.articles
  for each row execute function public.set_updated_at();

create table public.article_tags (
  article_id uuid not null references public.articles (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (article_id, tag_id)
);
create index article_tags_tag_idx on public.article_tags (tag_id);

-- ---------------------------------------------------------------------------
-- Structured collections
-- ---------------------------------------------------------------------------
create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  organization text not null,
  organization_url text,
  location text,
  start_label text,
  end_label text,
  sort_date date,
  logo_id uuid references public.media (id) on delete set null,
  summary text,
  bullets text[] not null default '{}',
  links jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  needs_review boolean not null default false,
  review_note text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index experiences_logo_idx on public.experiences (logo_id);
create trigger experiences_updated before update on public.experiences
  for each row execute function public.set_updated_at();

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  url text,
  sort_order int not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger skills_updated before update on public.skills
  for each row execute function public.set_updated_at();

create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  details text,
  image_id uuid references public.media (id) on delete set null,
  cta_label text,
  cta_url text,
  show_on_home boolean not null default false,
  sort_order int not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_image_idx on public.services (image_id);
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Settings, redirects, enquiries, activity
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  source text not null unique check (source ~ '^/[^\s]*$'),
  destination text not null,
  status_code int not null default 301 check (status_code in (301, 302, 307, 308)),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(full_name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  enquiry_type text not null check (length(enquiry_type) between 1 and 80),
  subject text check (subject is null or length(subject) <= 200),
  message text not null check (length(message) between 10 and 5000),
  consent boolean not null check (consent = true),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);
create index contact_email_idx on public.contact_submissions (lower(email), created_at);

create table public.activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  label text,
  created_at timestamptz not null default now()
);
create index activity_log_created_idx on public.activity_log (created_at desc);
create index activity_log_actor_idx on public.activity_log (actor_id);

-- Simple per-email rate limit for the contact form (max 3 per 10 minutes).
create or replace function public.contact_rate_ok(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) < 3 from public.contact_submissions
  where lower(email) = lower(p_email) and created_at > now() - interval '10 minutes';
$$;
revoke all on function public.contact_rate_ok(text) from public;
grant execute on function public.contact_rate_ok(text) to anon, authenticated;
