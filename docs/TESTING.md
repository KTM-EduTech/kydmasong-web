# Testing

## Automated and database checks (done, 22 Nov 2026)

| Check | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | Pass, 0 errors |
| ESLint (Next.js core-web-vitals + TS rules) | Pass, 0 errors, 0 warnings |
| Production build (`next build`) | Pass: 28 routes, proxy compiled |
| Supabase security advisor | 0 findings |
| Anonymous visitor sees only published pages (12 of 14) | Pass |
| Anonymous visitor cannot see hidden sections, draft roles or draft projects | Pass |
| Anonymous visitor cannot read enquiries or the activity log | Pass |
| Anonymous visitor cannot insert, update or delete content | Pass (blocked by RLS) |
| Anonymous visitor can submit a valid enquiry | Pass |
| Enquiry without consent, or with a forged status, is rejected | Pass |
| 4th enquiry from the same email within 10 minutes is rejected | Pass |
| Signed-in non-admin cannot see drafts, read enquiries or write content | Pass |

## Still to run in the deployment environment

These need the deployed site, a real administrator account and a browser (to click through the
dashboard). Tick each when done.

### Public site
- [ ] Every page in the main menu and footer loads (no 404 except the two unpublished legal pages)
- [ ] Light mode on first visit; dark mode toggle works and is remembered after reload
- [ ] Logo and favicon load
- [ ] Mobile (375 px) and tablet (768 px) layouts; mobile menu opens/closes; dropdowns work by keyboard
- [ ] `/contact` → `/contact-us`, `/home` → `/`, `/privacy-policy` and `/disclaimer` redirect
- [ ] `/sitemap.xml` and `/robots.txt` are correct; a random URL shows the 404 page
- [ ] No errors in the browser console

### Contact form
- [ ] Submitting with empty fields shows inline errors and keeps typed values
- [ ] A valid message shows the success state and appears in **Admin → Enquiries**
- [ ] Turnstile widget appears (once keys are set)

### Authentication
- [ ] Visiting `/admin` while signed out redirects to `/admin/login`
- [ ] Wrong password is rejected; correct password signs in
- [ ] Two-factor: enrol, sign out, sign in again with a code
- [ ] Sign out works

### CMS → public site
- [ ] Edit a page heading, save, and see it on the public page after refresh
- [ ] Create a page, add sections, publish, add it to Navigation, see it in the menu; then delete it
- [ ] Hide a section and reorder sections; check the public page
- [ ] Unpublish a page: it disappears from the site and its menu link hides
- [ ] Upload an image, set alt text, use it in a section; replace it; delete an unused image
- [ ] Copy an external image into the library
- [ ] Create, feature, reorder and unpublish a project
- [ ] Edit SEO title/description and check the page `<title>` and meta description
- [ ] Change footer text and contact email in Settings
- [ ] Add a redirect and test it
- [ ] Create a blog post, preview it while the blog is hidden
- [ ] Reload after each change: everything persists
