type NavItem = { href: string; label: string; badge?: "WIP" };
type NavSection = { label: string; items: NavItem[] };

export const navSections: NavSection[] = [
  {
    label: "Library",
    items: [
      { href: "/", label: "Home" },
      { href: "/download", label: "Download" },
      { href: "/liberator", label: "Liberator" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/settings", label: "Settings" },
      { href: "/updates", label: "Updates" },
    ],
  },
  {
    label: "Help",
    items: [{ href: "/faq", label: "FAQ" }],
  },
];

export type Crumb = { label: string; href: string };

const SEGMENT_LABELS: Record<string, string> = {
  settings: "Settings",
  account: "Account",
  downloads: "Downloads",
  discord: "Discord",
  multiplayer: "RadminVPN",
  updates: "Updates",
  download: "Download",
  faq: "FAQ",
  liberator: "Liberator",
};

export function normalizePath(path: string): string {
  if (!path) return "/";
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function isActivePath(href: string, pathname: string): boolean {
  const target = normalizePath(href);
  const current = normalizePath(pathname);
  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

function segmentLabel(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export function breadcrumbFor(path: string): Crumb[] {
  const normalized = normalizePath(path);
  const crumbs: Crumb[] = [{ label: "Launcher", href: "/" }];
  if (normalized === "/") {
    crumbs.push({ label: "Home", href: "/" });
    return crumbs;
  }
  let href = "";
  for (const segment of normalized.split("/").filter(Boolean)) {
    href += `/${segment}`;
    crumbs.push({ label: segmentLabel(segment), href });
  }
  return crumbs;
}
