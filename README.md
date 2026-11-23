# kydmasong.net — KTM EduTech website and CMS

The professional portfolio of **Kyd Tantano Masong / KTM EduTech**, with a private, WordPress-style
content management system at `/admin`.

- **Public site:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Poppins (self-hosted).
- **CMS data:** Supabase (Postgres + Row Level Security, Auth, Storage), project `kydmasong-web`, region `ap-southeast-1` (Singapore).
- **Hosting:** Netlify (free plan) to start; the code runs unchanged on Vercel.

## How it works

Every page is a row in `pages` made of ordered **sections** in `page_sections` (hero, rich text,
timeline, projects, services, contact form, …). Public pages are pre-rendered and cached; when you save
in `/admin`, the server action writes to Supabase and expires the cache, so changes appear within
seconds with no redeploy.

```
src/
  app/(site)/          public pages ([[...slug]] renders any CMS page; projects/ and blog/ have their own routes)
  app/admin/           login + dashboard (all screens) and server actions in app/admin/actions/
  components/blocks/   one renderer per section type
  components/admin/    editor UI (rich text, media picker, sortable lists, forms)
  lib/                 Supabase clients, data access, auth guard, section registry, settings schema
  proxy.ts             refreshes the admin session and protects /admin
supabase/
  migrations/          database schema, RLS policies, storage bucket (apply in order)
  seed/                migrated content (build_seed.py -> seed.sql)
docs/                  deployment, admin guide, migration log, testing
```

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000, admin at /admin
```

Checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Documentation

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): first-time setup, environment variables, Netlify, domain, backups, moving to Vercel
- [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md): using the dashboard
- [docs/MIGRATION-LOG.md](docs/MIGRATION-LOG.md): what was migrated from the old site and what still needs review
- [docs/TESTING.md](docs/TESTING.md): what has been tested and the pre-launch checklist
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md): colours, fonts, icons (Font Awesome), logo and hero rules
- [CLAUDE.md](CLAUDE.md): working rules for AI coding sessions

## Security in brief

- RLS on every table: the public can read only published content and can only insert contact enquiries.
- Writes require `private.is_admin()` (role = admin, and a second factor if one is enrolled).
- Admin pages and every server action re-check the session on the server.
- No secret keys in the website. No default admin account or password.
