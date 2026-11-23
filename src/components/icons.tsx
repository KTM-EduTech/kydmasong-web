/**
 * KTM EduTech icon system: Font Awesome (free), used everywhere through this module.
 *
 * Rules (see docs/DESIGN-SYSTEM.md):
 * - Import icons from "@/components/icons" only. Do not add other icon libraries or emoji/text glyphs.
 * - Solid style for interface icons, Brands for social platforms, Regular only where an outline reads better.
 * - Icons are decorative by default (aria-hidden). Pass `label` when an icon is the only content of a control.
 * - Size with the `size` prop (px) or text size; colour follows `currentColor`, so light/dark themes just work.
 * - Only individually imported icons are bundled (tree-shaken SVG); no icon fonts or CDN are loaded.
 */
import { config, type IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAlignCenter,
  faAlignLeft,
  faAlignRight,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faArrowUpRightFromSquare,
  faArrowsLeftRight,
  faBars,
  faBold,
  faBoxArchive,
  faBriefcase,
  faCheck,
  faChevronDown,
  faChevronRight,
  faChevronUp,
  faCircleCheck,
  faCloudArrowDown,
  faDiagramProject,
  faEnvelope,
  faEye,
  faEyeSlash,
  faFileCirclePlus,
  faFlag,
  faFloppyDisk,
  faFolderPlus,
  faGaugeHigh,
  faGear,
  faGlobe,
  faGripVertical,
  faHeading,
  faImage,
  faInbox,
  faIndent,
  faItalic,
  faLink,
  faLinkSlash,
  faList,
  faListOl,
  faLocationArrow,
  faLocationDot,
  faMagnifyingGlass,
  faMinus,
  faMoon,
  faNewspaper,
  faNoteSticky,
  faOutdent,
  faPaperPlane,
  faPen,
  faPlus,
  faQuoteLeft,
  faRightFromBracket,
  faRotateLeft,
  faRotateRight,
  faRoute,
  faShieldHalved,
  faSitemap,
  faStar,
  faSun,
  faTable,
  faTags,
  faTrashCan,
  faTriangleExclamation,
  faUnderline,
  faUpload,
  faUserGear,
  faVideo,
  faWandMagicSparkles,
  faWrench,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faCopy, faFileLines } from "@fortawesome/free-regular-svg-icons";
import {
  faFacebook,
  faGithub,
  faInstagram,
  faLinkedin,
  faTiktok,
  faXTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

// The base CSS is imported once in app/layout.tsx; don't inject it at runtime (avoids a flash of huge icons).
config.autoAddCss = false;

export type IconProps = {
  /** Pixel size (sets font-size; Font Awesome icons are 1em tall). */
  size?: number;
  className?: string;
  /** Accessible name. Omit for decorative icons next to visible text. */
  label?: string;
  /** Accepted for compatibility; icons are hidden from assistive tech unless `label` is set. */
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
};

function make(icon: IconDefinition, displayName: string) {
  const C = ({ size, className, label, "aria-label": ariaLabel }: IconProps) => {
    const name = label ?? ariaLabel;
    return (
      <FontAwesomeIcon
        icon={icon}
        className={className}
        style={size ? { fontSize: size } : undefined}
        aria-hidden={name ? undefined : true}
        aria-label={name}
        role={name ? "img" : undefined}
        title={name}
      />
    );
  };
  C.displayName = displayName;
  return C;
}

/* Navigation & actions */
export const ArrowLeft = make(faArrowLeft, "ArrowLeft");
export const ArrowRight = make(faArrowRight, "ArrowRight");
export const ArrowUp = make(faArrowUp, "ArrowUp");
export const ArrowUpRight = make(faArrowUpRightFromSquare, "ArrowUpRight"); // external link
export const ArrowsLeftRight = make(faArrowsLeftRight, "ArrowsLeftRight");
export const ChevronDown = make(faChevronDown, "ChevronDown");
export const ChevronRight = make(faChevronRight, "ChevronRight");
export const ChevronUp = make(faChevronUp, "ChevronUp");
export const Menu = make(faBars, "Menu");
export const X = make(faXmark, "X");
export const Plus = make(faPlus, "Plus");
export const Minus = make(faMinus, "Minus");
export const Check = make(faCheck, "Check");
export const CheckCircle2 = make(faCircleCheck, "CheckCircle2");
export const AlertTriangle = make(faTriangleExclamation, "AlertTriangle");
export const Search = make(faMagnifyingGlass, "Search");
export const Save = make(faFloppyDisk, "Save");
export const Pencil = make(faPen, "Pencil");
export const Trash2 = make(faTrashCan, "Trash2");
export const Copy = make(faCopy, "Copy");
export const Eye = make(faEye, "Eye");
export const EyeOff = make(faEyeSlash, "EyeOff");
export const Upload = make(faUpload, "Upload");
export const CloudDownload = make(faCloudArrowDown, "CloudDownload");
export const RefreshCw = make(faRotateRight, "RefreshCw");
export const Undo2 = make(faRotateLeft, "Undo2");
export const Redo2 = make(faRotateRight, "Redo2");
export const GripVertical = make(faGripVertical, "GripVertical");
export const ArrowLeftToLine = make(faOutdent, "ArrowLeftToLine");
export const ArrowRightToLine = make(faIndent, "ArrowRightToLine");
export const LogOut = make(faRightFromBracket, "LogOut");
export const Send = make(faPaperPlane, "Send");
export const Flag = make(faFlag, "Flag");
export const Star = make(faStar, "Star");
export const Archive = make(faBoxArchive, "Archive");
export const Inbox = make(faInbox, "Inbox");

/* Content & admin sections */
export const LayoutDashboard = make(faGaugeHigh, "LayoutDashboard");
export const FileText = make(faFileLines, "FileText");
export const FilePlus2 = make(faFileCirclePlus, "FilePlus2");
export const FolderKanban = make(faDiagramProject, "FolderKanban");
export const FolderPlus = make(faFolderPlus, "FolderPlus");
export const Briefcase = make(faBriefcase, "Briefcase");
export const Sparkles = make(faWandMagicSparkles, "Sparkles");
export const Wrench = make(faWrench, "Wrench");
export const Newspaper = make(faNewspaper, "Newspaper");
export const Tags = make(faTags, "Tags");
export const ImageIcon = make(faImage, "ImageIcon");
export const ListTree = make(faSitemap, "ListTree");
export const Route = make(faRoute, "Route");
export const Settings = make(faGear, "Settings");
export const UserCog = make(faUserGear, "UserCog");
export const ShieldCheck = make(faShieldHalved, "ShieldCheck");

/* Contact & location */
export const Mail = make(faEnvelope, "Mail");
export const MapPin = make(faLocationDot, "MapPin");
export const Navigation = make(faLocationArrow, "Navigation");
export const Globe = make(faGlobe, "Globe");

/* Theme */
export const Moon = make(faMoon, "Moon");
export const Sun = make(faSun, "Sun");

/* Rich-text editor */
export const Bold = make(faBold, "Bold");
export const Italic = make(faItalic, "Italic");
export const UnderlineIcon = make(faUnderline, "UnderlineIcon");
export const Heading2 = make(faHeading, "Heading2");
export const Heading3 = make(faHeading, "Heading3");
export const List = make(faList, "List");
export const ListOrdered = make(faListOl, "ListOrdered");
export const Quote = make(faQuoteLeft, "Quote");
export const StickyNote = make(faNoteSticky, "StickyNote");
export const AlignLeft = make(faAlignLeft, "AlignLeft");
export const AlignCenter = make(faAlignCenter, "AlignCenter");
export const AlignRight = make(faAlignRight, "AlignRight");
export const Link2 = make(faLink, "Link2");
export const Unlink = make(faLinkSlash, "Unlink");
export const TableIcon = make(faTable, "TableIcon");
export const YoutubeIcon = make(faVideo, "YoutubeIcon");

/* Social platforms (Brands). Unknown platforms fall back to a globe. */
const BRANDS: Record<string, IconDefinition> = {
  github: faGithub,
  linkedin: faLinkedin,
  youtube: faYoutube,
  facebook: faFacebook,
  x: faXTwitter,
  twitter: faXTwitter,
  instagram: faInstagram,
  tiktok: faTiktok,
};
export function SocialIcon({ platform, size, className }: { platform: string; size?: number; className?: string }) {
  const icon = BRANDS[platform.trim().toLowerCase().replace(/\s+/g, "")] ?? faGlobe;
  return <FontAwesomeIcon icon={icon} className={className} style={size ? { fontSize: size } : undefined} aria-hidden />;
}
