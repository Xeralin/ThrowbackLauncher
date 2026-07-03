"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { breadcrumbFor, normalizePath } from "@/config/nav";
import { useHasLocalSeasons } from "@/lib/bridge";
import { useDetail } from "@/lib/detail";

const linkClass = "no-underline transition-colors hover:text-text";

export function Topbar() {
  const base = breadcrumbFor(normalizePath(usePathname()));
  const { detail } = useDetail();
  const hasLocal = useHasLocalSeasons();
  const crumbs = detail ? [...base, { label: detail.label }] : base;
  const lastIndex = crumbs.length - 1;
  const resetIndex = detail ? base.length - 1 : -1;

  return (
    <div className="sticky top-0 z-50 flex h-[var(--topbar-h)] items-center border-b border-border bg-surface px-8 max-[56.25em]:pl-14 max-[56.25em]:pr-4">
      <div className="min-w-0 font-mono text-[0.75rem] tracking-[0.04em] text-text-muted">
        {crumbs.map((crumb, index) => {
          if (index === lastIndex) {
            return (
              <span key={index} className="text-text">
                {crumb.label}
              </span>
            );
          }
          return (
            <span key={index}>
              {index === resetIndex ? (
                <button
                  type="button"
                  onClick={detail?.reset}
                  className={linkClass}
                >
                  {crumb.label}
                </button>
              ) : (crumb as { href: string }).href === "/" &&
                hasLocal === false ? (
                <span>{crumb.label}</span>
              ) : (
                <Link
                  href={(crumb as { href: string }).href}
                  className={linkClass}
                >
                  {crumb.label}
                </Link>
              )}
              {" / "}
            </span>
          );
        })}
        <span className="ml-px inline-block animate-blink">_</span>
      </div>
      <div id="topbar-actions" className="ml-auto flex items-center" />
    </div>
  );
}
