import "server-only";
import { generateHTML } from "@tiptap/html/server";
import sanitizeHtml from "sanitize-html";
import { richTextExtensions } from "./extensions";

const ALLOWED_IFRAME_HOSTS = ["www.youtube-nocookie.com", "www.youtube.com", "read.bookcreator.com", "www.google.com"];

export function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "code", "pre", "blockquote",
      "ul", "ol", "li", "a", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
      "aside", "div", "iframe", "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "data-align", "loading"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "title", "loading"],
      aside: ["data-callout", "class"],
      div: ["data-youtube-video", "class"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      "*": [],
    },
    allowedStyles: { "*": { "text-align": [/^(left|right|center|justify)$/] } },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "#";
        const external = /^https?:\/\//.test(href);
        const out: Record<string, string> = external ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
        return { tagName, attribs: out };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}

/** Render stored Tiptap JSON to sanitised HTML. Returns "" for empty content. */
export function renderRichText(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  try {
    return sanitize(generateHTML(doc as Parameters<typeof generateHTML>[0], richTextExtensions()));
  } catch {
    return "";
  }
}

/** Plain text with blank-line paragraphs -> safe HTML paragraphs. */
export function plainToHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${sanitizeHtml(p.trim(), { allowedTags: [], allowedAttributes: {} }).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}
