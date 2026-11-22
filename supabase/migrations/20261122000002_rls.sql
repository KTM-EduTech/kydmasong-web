-- Row Level Security policies
-- Pattern: anon may read published rows; admins read everything; only admins write.

alter table public.profiles enable row level security;
alter table public.media_folders enable row level security;
alter table public.media enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.nav_items enable row level security;
alter table public.projects enable row level security;
alter table public.project_tags enable row level security;
alter table public.articles enable row level security;
alter table public.article_tags enable row level security;
alter table public.experiences enable row level security;
alter table public.skills enable row level security;
alter table public.services enable row level security;
alter table public.site_settings enable row level security;
alter table public.redirects enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.activity_log enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_admin_update on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Admin write access (insert/update/delete) on every content table.
do $$
declare t text;
begin
  foreach t in array array[
    'media_folders','media','categories','tags','pages','page_sections','nav_items',
    'projects','project_tags','articles','article_tags','experiences','skills',
    'services','site_settings','redirects'
  ] loop
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.is_admin()))', t || '_admin_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t || '_admin_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select public.is_admin()))', t || '_admin_delete', t);
  end loop;
end $$;

-- Read policies (one per table; admins see everything, the public sees published rows)
create policy media_folders_read on public.media_folders for select to anon, authenticated using (true);
create policy media_read on public.media for select to anon, authenticated using (true);
create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy tags_read on public.tags for select to anon, authenticated using (true);
create policy site_settings_read on public.site_settings for select to anon, authenticated using (true);
create policy redirects_read on public.redirects for select to anon, authenticated
  using (enabled or (select public.is_admin()));
create policy pages_read on public.pages for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));
create policy page_sections_read on public.page_sections for select to anon, authenticated
  using (
    (select public.is_admin()) or (
      visible and exists (select 1 from public.pages p where p.id = page_id and p.status = 'published')
    )
  );
create policy nav_items_read on public.nav_items for select to anon, authenticated
  using (enabled or (select public.is_admin()));
create policy projects_read on public.projects for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));
create policy project_tags_read on public.project_tags for select to anon, authenticated
  using ((select public.is_admin()) or exists (select 1 from public.projects p where p.id = project_id and p.status = 'published'));
create policy articles_read on public.articles for select to anon, authenticated
  using ((status = 'published' and published_at is not null and published_at <= now()) or (select public.is_admin()));
create policy article_tags_read on public.article_tags for select to anon, authenticated
  using ((select public.is_admin()) or exists (
    select 1 from public.articles a where a.id = article_id and a.status = 'published' and a.published_at <= now()
  ));
create policy experiences_read on public.experiences for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));
create policy skills_read on public.skills for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));
create policy services_read on public.services for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy contact_public_insert on public.contact_submissions for insert to anon, authenticated
  with check (status = 'new' and consent = true and public.contact_rate_ok(email));
create policy contact_admin_read on public.contact_submissions for select to authenticated
  using ((select public.is_admin()));
create policy contact_admin_update on public.contact_submissions for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy contact_admin_delete on public.contact_submissions for delete to authenticated
  using ((select public.is_admin()));

create policy activity_admin_read on public.activity_log for select to authenticated
  using ((select public.is_admin()));
create policy activity_admin_insert on public.activity_log for insert to authenticated
  with check ((select public.is_admin()) and actor_id = (select auth.uid()));

-- Storage: public "media" bucket, admin-only writes, 10 MB limit
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy media_bucket_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
create policy media_bucket_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));
create policy media_bucket_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));
create policy media_bucket_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
