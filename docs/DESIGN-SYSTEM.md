# KTM EduTech design system

The rules every change to the public site and the CMS must follow. Approved by Kyd on 23 Nov 2026.

## Brand colours

| Token | Value | Use |
|---|---|---|
| Navy | `#232450` | Primary brand colour, bands, dark surfaces |
| Gold | `#FEDC69` | Accent, primary buttons, highlights |

Colours are CSS variables in `src/app/globals.css` (`--color-*`), and the brand pair can also be set in
*Admin → Settings*. Use the Tailwind tokens (`bg-navy`, `text-gold`, `text-muted`, `border-line`,
`bg-band`, `text-on-band`); do not hard-code hex values in components. Every component must work in both
light (default) and dark themes (`[data-theme="dark"]`).

## Typography

- **Poppins**: the primary typeface for everything (`font-sans`, the default).
- **Anton**: the secondary display typeface (`font-display`). Use it only for display text: the
  homepage hero title (`.kyd-hero-title`), figure captions, hero pop-up titles and statistic values.
  Do not use it for body text, navigation, forms or the CMS.
- Both are self-hosted from `@fontsource/*` via `next/font/local` in `src/app/layout.tsx`. Poppins is
  preloaded; Anton is **not** (`preload: false`), so it downloads only on pages that render display text.
  Do not add Google Fonts links or other font packages.

## Icons: Font Awesome (free)

- Import icons **only** from `@/components/icons`. That module wraps `@fortawesome/react-fontawesome`
  with individually imported SVG icons (tree-shaken; no icon font, no CDN, no kit).
- Do not add other icon libraries (lucide, heroicons, react-icons…), emoji or text glyphs (`+`, `−`, `⇆`,
  `×`) as icons. If an icon is missing, import it in `icons.tsx` and export it with a descriptive name.
- Styles: **Solid** for interface icons; **Brands** for social platforms (`<SocialIcon platform="…" />`,
  which falls back to a globe); **Regular** only where an outline reads better (currently Copy, FileText).
- Size with the `size` prop (pixels) so icons sit consistently next to text; colour always follows
  `currentColor`, so icons adapt to light/dark themes and hover states automatically.
- Accessibility: icons are decorative (`aria-hidden`) by default. When an icon is the only content of a
  button or link, give the control an `aria-label` (or pass `label` to the icon).
- The Font Awesome base CSS is imported once in `src/app/layout.tsx` and `config.autoAddCss` is off.

## Logo

- The logo is **`ktm-logo gs.png`** (ImageKit, `KTM EduTech Images/`), set in *Admin → Settings → Logo*.
- The header, footer and admin login all read `settings.logo_url`; never hard-code a logo path in a
  component. To change the logo, change the setting.

## Homepage hero ("figures" layout)

- The homepage hero uses the **figures** layout permanently (two portrait cards: Teacher and Developer).
  The before/after slider layout remains available for other pages but is not to be restored on the home
  page.
- Every hero field is rendered: eyebrow, heading, highlighted phrase, intro, both buttons and their
  optional pop-ups, and the figure cards. The highlight works in both layouts.
- Figure portraits and backgrounds are chosen from the **media library** (`image_id`, `background_id`).
  The image's alt text in the library is used, falling back to the caption. Legacy `image_url` /
  `background_url` values are still honoured so older content keeps rendering.
- In the CMS, fields that apply to only one layout are shown only when that layout is selected
  (`showIf` in `src/lib/sections.ts`).
- Layout is responsive: stacked and centred on mobile, two columns from `lg`. Hover/focus animations are
  disabled under `prefers-reduced-motion`.

## Adding things

- New section type: add a definition to `src/lib/sections.ts` and a renderer in
  `src/components/blocks/Blocks.tsx`. Every field in the definition must be rendered.
- Images in sections: use a `media` field (key ending `_id`), never a free-text URL field.
