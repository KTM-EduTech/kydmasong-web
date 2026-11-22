import Image from "next/image";
import { mediaUrl, type MediaMap } from "@/lib/media";

const OPTIMIZED_HOSTS = new Set(
  [
    (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
      } catch {
        return "";
      }
    })(),
    "ik.imagekit.io",
    "d1yei2z3i6k35z.cloudfront.net",
  ].filter(Boolean),
);

type Props = {
  id?: string | null;
  media: MediaMap;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  altOverride?: string;
};

/** Renders a media-library image by id with its stored alt text. */
export function MediaImage({ id, media, className, sizes = "100vw", priority, fill, altOverride }: Props) {
  const m = id ? media[id] : undefined;
  if (!m) return null;
  const src = mediaUrl(m);
  if (!src) return null;
  const alt = altOverride ?? m.alt ?? "";
  let host = "";
  try {
    host = new URL(src).hostname;
  } catch {}
  const isSvg = m.mime_type === "image/svg+xml" || src.split("?")[0].endsWith(".svg");
  if (!OPTIMIZED_HOSTS.has(host) || isSvg || m.mime_type === "image/gif") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} loading={priority ? "eager" : "lazy"} />;
  }
  if (fill || !m.width || !m.height) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={`object-cover ${className ?? ""}`} priority={priority} />;
  }
  return <Image src={src} alt={alt} width={m.width} height={m.height} sizes={sizes} className={className} priority={priority} />;
}
