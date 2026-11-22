import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSettings } from "@/lib/data";
import "./globals.css";

// Poppins is self-hosted from @fontsource/poppins: no request to Google at runtime.
const poppins = localFont({
  src: [
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

// Anton (hero headline) is self-hosted from @fontsource/anton, same as Poppins.
const anton = localFont({
  src: [{ path: "../../node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2", weight: "400", style: "normal" }],
  variable: "--font-anton",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kydmasong.net";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: s.seo_default_title, template: s.seo_title_template },
    description: s.seo_default_description || undefined,
    robots: process.env.NEXT_PUBLIC_NOINDEX === "1" ? { index: false, follow: false } : undefined,
    icons: s.favicon_url ? { icon: s.favicon_url, apple: s.favicon_url } : undefined,
    openGraph: {
      siteName: s.site_name,
      type: "website",
      images: s.seo_og_image_url ? [s.seo_og_image_url] : undefined,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#14152f" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  // Set the theme before first paint: saved choice, else the CMS default (light).
  const themeScript = `(function(){try{var t=localStorage.getItem('ktm-theme');if(t!=='light'&&t!=='dark')t=${JSON.stringify(s.default_theme)};document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})();`;
  return (
    <html lang="en" data-theme={s.default_theme} className={`${poppins.variable} ${anton.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Brand colours from Settings (validated as #RRGGBB, so safe to inline). */}
        <style>{`:root{--navy:${s.brand_navy};--gold:${s.brand_gold};--ink-light:${s.brand_navy}}:root:not([data-theme="dark"]){--ink:${s.brand_navy};--band:${s.brand_navy};--focus:${s.brand_navy}}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
