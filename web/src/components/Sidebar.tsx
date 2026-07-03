"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { isActivePath, navSections, normalizePath } from "@/config/nav";
import { site } from "@/config/site";
import {
  useDownloader,
  useInfo,
  usePlatform,
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
  onOpen,
}: {
  season: Season;
  status?: string;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="group relative mx-2 mb-2 block h-12 w-[calc(100%-1rem)] overflow-hidden rounded-md border border-border text-left transition-colors hover:border-border-brand"
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
          <span className="shrink-0 font-mono text-[0.65rem] leading-none text-white">
            {status}
          </span>
        )}
      </div>
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
  const os = usePlatform();
  const update = useUpdate();
  const { detail } = useDetail();
  const dl = useDownloader();
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
              {section.items
                .filter((item) => item.href !== "/radmin" || os === "linux")
                .map((item) => {
                  const active = isActivePath(item.href, pathname);
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
                      className={`nav-link flex items-center justify-between rounded-md px-3 py-[0.55rem] text-[0.9rem] font-medium no-underline transition-[background-color,color,left] duration-150 ${
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
                onClick={() => openSeason(season.key)}
                className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-border"
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
