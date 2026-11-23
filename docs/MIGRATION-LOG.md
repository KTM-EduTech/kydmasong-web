# Migration log (kydmasong.net → new CMS)

Source of truth: the audit document and Kyd's confirmations of 22 Nov 2026.

## How content was migrated

- **Confirmed facts** (names, titles, dates, URLs, the contact wording, project descriptions for the
  Student Collection System, House Point System and C-Spinner) were entered as given.
- **Headings** were copied word for word from the old pages.
- **Body text** was captured as summaries (no browser was available for word-for-word copying). Every
  such section is flagged **Needs review** in the dashboard with the note "Captured as a summary of the
  original page". Replace with your exact wording or approve.
- **Nothing unverified is published.**

## Held as draft or hidden (needs Kyd)

| Item | Where | Why |
| --- | --- | --- |
| PBISS EdTech Designer-Developer | Work experience (draft) | Start date to confirm (old site: Jan 2025, overlaps Trinity) |
| PBISS Computer Science and ICT Teacher | Work experience (draft) | Confirm start month (old site: Sep 2025) |
| Education: institutions and dates | Education page, hidden "Qualifications" section | Pending verification; nothing filled in |
| KTM EduPlatform | Projects (draft) | Description drafted only from the app's landing page |
| Cookie Policy, Terms and Conditions | Pages (draft) | Exact legal text must be pasted; not rewritten |
| Privacy Policy, Disclaimer | Redirects (302) to legalframeworks.ktm-edutech.net | Confirm the exact URLs |
| Impact counters | Home (hidden section) | Await verified figures |
| Testimonials | Home (hidden section) | Await genuine quotes with permission |

## Changes applied (approved)

- Location: "Based in Samut Prakan, Thailand · Currently in Koh Samui, Surat Thani, Thailand" and
  availability for remote collaboration on Home, About, Contact, footer. Map pin stays on Samut Prakan.
- Email `contact@kydmasong.net`; no phone number. Bangkok address is not shown as a location.
- PBISS name in full; job title "Computer Science and ICT Teacher". Assumption College from May 2004.
- Skill percentages removed; skills grouped by category.
- Page titles fixed ("Contact" instead of "HOME | Contact"; SEO titles added to empty pages).
- Duplicate focus areas removed; broken `#contact` links replaced with email/contact links.
- Typos in alt text not carried over.

## URLs

All 15 existing paths keep working, except the two legal pages pending text (Cookie Policy, Terms),
which return 404 until published. New: `/resources`, `/projects/<slug>`, `/blog` (hidden).
Redirects: `/contact → /contact-us`, `/home → /`, `/dashboard → /admin`, `/privacy-policy` and
`/disclaimer` → legal frameworks site.

## Images

21 images are registered in the media library as **external links** to ImageKit and the old site's
CloudFront host. Use *Media library → Copy into library* on each (especially the CloudFront ones, which
may disappear with the old site). Work-experience school logos were not migrated (their URLs were not
readable); upload them in *Work experience*.

## 23 Nov 2026: design decisions (branch `design/figures-fontawesome`)

- Homepage hero keeps the **figures** layout permanently. Figure images are now media-library fields
  (`image_id`, `background_id`); the current live URLs still render. Optional script to move the live
  data to media ids: `supabase/manual/2026-11-23_hero_figures_to_media.sql` (not yet run).
- Icons: Lucide removed; **Font Awesome** (free solid/regular/brands, SVG) via `src/components/icons.tsx`.
  Footer social links now show brand icons.
- Fonts: Anton is the approved display font, no longer preloaded on every page.
- Logo: `ktm-logo gs.png` everywhere (seed updated to match the live setting).
- See `docs/DESIGN-SYSTEM.md`.
