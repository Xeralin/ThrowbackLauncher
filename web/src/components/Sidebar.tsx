"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isActivePath, navSections, normalizePath } from "@/config/nav";
import { site } from "@/config/site";
import {
  useDownloader,
  useHasLocalSeasons,
  useInfo,
  useSeasons,
  useUpdate,
  type Season,
} from "@/lib/bridge";
import { useDetail } from "@/lib/detail";

const STATE_LABELS: Record<string, string> = {
  preparing: "Preparing",
  applying: "Applying",
};

function DownloadCard({
  season,
  status,
  progress,
  onOpen,
}: {
  season: Season;
  status?: string;
  progress: number;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="relative mx-2 mb-2 block h-12 w-[calc(100%-1rem)] overflow-hidden rounded-md border border-border text-left"
    >
      {season.splash ? (
        <Image
          src={season.splash}
          alt=""
          fill
          sizes="280px"
          className="object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0d12] to-[#0d0d0f]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/45" />
      <div className="absolute inset-0 flex items-center justify-between gap-2 px-2.5 pt-[2px]">
        <span className="truncate font-display text-[0.8rem] font-bold leading-none text-text">
          {season.code} {season.name}
        </span>
        {status && (
          <span className="shrink-0 font-display text-[0.8rem] font-bold leading-none text-text">
            {status}
          </span>
        )}
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-px origin-left rounded-[1px] bg-[#b47ad4] transition-transform duration-200"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </button>
  );
}

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate?: () => void;
}) {
  const pathname = normalizePath(usePathname());
  const router = useRouter();
  const info = useInfo();
  const update = useUpdate();
  const hasLocal = useHasLocalSeasons();
  const [dragKey, setDragKey] = useState<string | null>(null);
  const { detail } = useDetail();
  const dl = useDownloader();
  if (dragKey !== null && !dl.queue.includes(dragKey)) setDragKey(null);
  const seasons = useSeasons();
  const activeSeason = dl.running
    ? seasons?.find((season) => season.key === dl.activeKey)
    : undefined;
  const queuedSeasons = dl.queue
    .map((key) => seasons?.find((season) => season.key === key))
    .filter((season): season is Season => Boolean(season));

  function openSeason(key: string) {
    onNavigate?.();
    if (detail?.seasonKey === key) return;
    if (pathname === "/download") {
      window.dispatchEvent(
        new CustomEvent("throwback:open-season", { detail: key }),
      );
    } else {
      window.sessionStorage.setItem("tb-open-season", key);
      router.push("/download");
    }
  }

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
          const sectionActive = section.items.some((item) =>
            isActivePath(item.href, pathname),
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
                const hidden =
                  item.href === "/" && !(hasLocal ?? pathname === "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(event) => {
                      onNavigate?.();
                      if (active && detail) {
                        event.preventDefault();
                        detail.reset();
                      }
                    }}
                    aria-current={active ? "page" : undefined}
                    aria-hidden={hidden || undefined}
                    tabIndex={hidden ? -1 : undefined}
                    className={`nav-link flex items-center justify-between overflow-hidden rounded-md px-3 text-[0.9rem] font-medium no-underline transition-[background-color,color,left,max-height,opacity,padding] duration-150 ${
                      hidden
                        ? "pointer-events-none max-h-0 py-0 opacity-0"
                        : "max-h-10 py-[0.55rem] opacity-100"
                    } ${
                      active
                        ? "border-l-2 border-brand bg-brand-dim text-text shadow-[inset_0_0_14px_rgba(192,21,42,0.18)]"
                        : "text-text-muted hover:bg-surface-2 hover:text-text"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.href === "/updates" &&
                      update.components.length > 0 && (
                        <span className="font-mono text-[0.7rem] leading-none text-text">
                          {update.components.length}
                        </span>
                      )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto">
        {queuedSeasons.length > 0 && (
          <div className="mx-2 mb-2 max-h-36 overflow-y-auto rounded-md border border-border bg-surface-2">
            {queuedSeasons.map((season, index) => (
              <button
                key={season.key}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  setDragKey(season.key);
                }}
                onDragEnd={() => setDragKey(null)}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!dragKey || dragKey === season.key) return;
                  const from = dl.queue.indexOf(dragKey);
                  const to = dl.queue.indexOf(season.key);
                  if (from < 0 || to < 0) return;
                  const keys = [...dl.queue];
                  keys.splice(from, 1);
                  keys.splice(to, 0, dragKey);
                  dl.reorderQueue(keys);
                }}
                onClick={() => openSeason(season.key)}
                className={`group flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-border ${
                  dragKey === season.key ? "opacity-40" : ""
                }`}
              >
                <span className="font-mono text-[0.6rem] text-text-muted">
                  {index + 1}
                </span>
                <span className="truncate font-display text-[0.75rem] font-bold leading-none text-text-muted transition-colors group-hover:text-text">
                  {season.code} {season.name}
                </span>
              </button>
            ))}
          </div>
        )}
        {activeSeason && (
          <DownloadCard
            season={activeSeason}
            status={
              dl.state === "downloading"
                ? `${Math.round(dl.progress)}%`
                : STATE_LABELS[dl.state]
            }
            progress={dl.progress}
            onOpen={() => openSeason(activeSeason.key)}
          />
        )}
        <div className="flex h-11 items-center border-t border-border px-5 font-mono text-[0.6rem] tracking-[0.05em] text-text-muted">
          <span>
            {site.author}
            {info && (
              <>
                {" — "}
                <span className="whitespace-nowrap text-brand">
                  v{info.version}
                </span>
              </>
            )}
          </span>
        </div>
      </div>
    </aside>
  );
}
