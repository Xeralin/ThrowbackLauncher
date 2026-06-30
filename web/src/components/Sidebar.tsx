"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, navSections, normalizePath } from "@/config/nav";
import { site } from "@/config/site";
import { Badge } from "@/components/Badge";
import { usePlatform } from "@/lib/bridge";

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate?: () => void;
}) {
  const pathname = normalizePath(usePathname());
  const os = usePlatform();

  return (
    <aside
      id="sidebar"
      className={`fixed inset-y-0 left-0 z-[100] flex w-[var(--sidebar-w)] flex-col overflow-y-auto border-r border-border bg-surface max-[56.25em]:transition-transform max-[56.25em]:duration-[250ms] ${
        open ? "max-[56.25em]:translate-x-0" : "max-[56.25em]:-translate-x-full"
      }`}
    >
      <div className="border-b border-border px-5 pb-4 pt-6 max-[56.25em]:pt-14">
        <div className="mb-[0.3rem] font-mono text-[0.65rem] uppercase tracking-[0.15em] text-brand">
          {"// R6S COMMUNITY"}
          <span className="ml-px inline-block animate-blink">_</span>
        </div>
        <div className="font-display text-[1.2rem] font-bold leading-[1.2] text-text">
          <span className="text-brand">Throwback</span> Launcher
        </div>
      </div>

      <nav>
        {navSections.map((section) => {
          const sectionActive = section.items.some(
            (item) => isActivePath(item.href, pathname),
          );
          return (
            <div key={section.label} className="px-3 pb-2 pt-[1.2rem]">
              <div
                className={`mb-[0.4rem] px-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] ${
                  sectionActive ? "text-brand" : "text-text-muted"
                }`}
              >
                {section.label}
              </div>
              {section.items.map((item) => {
                const active = isActivePath(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`nav-link flex items-center justify-between rounded-md px-3 py-[0.55rem] text-[0.9rem] font-medium no-underline transition-[background-color,color,left] duration-150 ${
                      active
                        ? "border-l-2 border-brand bg-brand-dim text-text shadow-[inset_0_0_14px_rgba(192,21,42,0.18)]"
                        : "text-text-muted hover:bg-surface-2 hover:text-text"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && <Badge variant="wip">{item.badge}</Badge>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border px-5 py-4 font-mono text-[0.6rem] tracking-[0.05em] text-text-muted">
        {site.author}
        {os && <span className="text-brand"> · {os.toUpperCase()}</span>}
      </div>
    </aside>
  );
}
