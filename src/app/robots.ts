import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kydmasong.net";

// Keeps the current site's rules: search engines allowed, AI-training crawlers
// blocked, private areas excluded.
const AI_TRAINING_BOTS = [
  "Amazonbot", "Applebot-Extended", "Bytespider", "CCBot", "ClaudeBot", "Google-Extended", "GoogleOther",
  "GPTBot", "meta-externalagent", "PerplexityBot", "Baiduspider", "anthropic-ai", "cohere-ai", "Diffbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/api/"] },
      ...AI_TRAINING_BOTS.map((ua) => ({ userAgent: ua, disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
