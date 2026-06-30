"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { breadcrumbFor, normalizePath } from "@/config/nav";

export function Topbar() {
  const crumbs = breadcrumbFor(normalizePath(usePathname()));
  const lastIndex = crumbs.length - 1;

  return (
    <div className="sticky top-0 z-50 flex h-[var(--topbar-h)] items-center border-b border-border bg-surface px-8 max-[56.25em]:pl-14 max-[56.25em]:pr-4">
      <div className="font-mono text-[0.75rem] tracking-[0.04em] text-[#4a4a60]">
        {crumbs.map((crumb, index) =>
          index === lastIndex ? (
            <span key={index} className="font-semibold text-text">
              {crumb.label}
            </span>
          ) : (
            <span key={index}>
              <Link
                href={crumb.href}
                className="no-underline transition-colors hover:text-text"
              >
                {crumb.label}
              </Link>
              {" / "}
            </span>
          ),
        )}
        <span className="ml-px inline-block animate-blink text-text-muted">
          _
        </span>
      </div>
    </div>
  );
}
