@AGENTS.md

# Working on kydmasong-web (KTM EduTech website + CMS)

Read `docs/DESIGN-SYSTEM.md` before any visual change, and `README.md` for the architecture.

## Ground rules from the owner (Kyd)

- Work on a branch. **Every push to `main` deploys production on Netlify** (and costs credits); merge only
  after Kyd approves.
- Small, controlled changes. No rebuilds, no unrelated changes, no new dependencies without a reason.
- Do not edit live database content directly. Content is changed through the CMS; schema changes go in
  `supabase/migrations/`; one-off data fixes go in `supabase/manual/` and are run only when approved.
- No paid services, add-ons or plan upgrades. Do not connect or change the domain www.kydmasong.net.
- Never ask for or handle Kyd's passwords or authentication codes.
- Do not invent content: legal text, employment details, dates or project descriptions. Unverified
  content stays unpublished or flagged "needs review".

## Design decisions (fixed)

- Fonts: Poppins (primary), Anton (display only, not preloaded).
- Icons: Font Awesome via `@/components/icons` only.
- Logo: `ktm-logo gs.png`, read from settings.
- Homepage hero: the "figures" layout, images from the media library.

## Checks before committing

`npx tsc --noEmit`, `npx eslint src`, `npm run build`.
