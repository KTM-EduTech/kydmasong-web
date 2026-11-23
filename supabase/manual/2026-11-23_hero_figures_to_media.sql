-- OPTIONAL, NOT YET RUN. Prepared 2026-11-23 on branch design/figures-fontawesome.
-- Moves the live homepage figure cards from typed image URLs to media-library images,
-- so they can be swapped from Admin > Pages > Home without touching URLs.
-- The site already renders the current data correctly (legacy image_url/background_url
-- are still honoured), so this is only needed for editing convenience.
-- Run only after the branch is approved and deployed. Run in the Supabase SQL editor.

begin;

-- 1. Register the two card backgrounds in the media library (no-op if already there).
insert into public.media (id, folder_id, external_url, file_name, mime_type, alt)
values
  ('a83df2a9-ea9d-5944-a32b-2e9832803ab9', (select id from public.media_folders where name = 'Migrated from kydmasong.net'), 'https://ik.imagekit.io/ktmedutech/KYDMASONG%20NET/classroom.png', 'classroom.png', 'image/png', ''),
  ('e511ce13-2f1c-500c-810f-f83eeaad0c09', (select id from public.media_folders where name = 'Migrated from kydmasong.net'), 'https://ik.imagekit.io/ktmedutech/KYDMASONG%20NET/Studio.png', 'Studio.png', 'image/png', '')
on conflict (id) do nothing;

-- 2. Point the two figure cards at media ids. Only the `figures` key changes;
--    captions and links are kept, every other hero field is untouched.
update public.page_sections ps
set data = jsonb_set(ps.data, '{figures}', (
  select jsonb_agg(
    (f - 'image_url' - 'background_url')
    || case f->>'caption'
         when 'Teacher'   then '{"image_id":"759805e6-2fac-5842-9963-b6519eef1e27","background_id":"a83df2a9-ea9d-5944-a32b-2e9832803ab9"}'::jsonb
         when 'Developer' then '{"image_id":"a63bcfb0-564a-554d-b853-d58b8f98d0d8","background_id":"e511ce13-2f1c-500c-810f-f83eeaad0c09"}'::jsonb
         else jsonb_build_object('image_url', f->'image_url', 'background_url', f->'background_url')
       end
    order by ord)
  from jsonb_array_elements(ps.data->'figures') with ordinality as x(f, ord)
))
from public.pages p
where ps.page_id = p.id and p.slug = 'home' and ps.type = 'hero'
  and jsonb_typeof(ps.data->'figures') = 'array';

commit;
