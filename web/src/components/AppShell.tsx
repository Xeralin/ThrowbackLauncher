"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Toasts } from "./Toasts";
import { Topbar } from "./Topbar";
import { ScrollReveal } from "./ScrollReveal";
import { breadcrumbFor, normalizePath } from "@/config/nav";
import {
  onBridgeEvent,
  useHasLocalSeasons,
  useInfo,
  useSettings,
} from "@/lib/bridge";
import { DetailContext, type DetailCrumb } from "@/lib/detail";
import { showToast } from "@/lib/toast";

function BridgeToasts() {
  const settings = useSettings();
  const info = useInfo();

  useEffect(() => {
    if (info?.warning) showToast("warning", info.warning);
  }, [info?.warning]);

  useEffect(() => {
    if (!settings) return;
    const onInvalid = (_field: string, message: string) =>
      showToast("error", message);
    settings.invalid_setting.connect(onInvalid);
    return () => settings.invalid_setting.disconnect(onInvalid);
  }, [settings]);

  useEffect(
    () =>
      onBridgeEvent("downloader", (event, args) => {
        if (event === "partial_deleted") {
          showToast(args[1] ? "success" : "error", args[2] as string);
        } else if (event === "steam_setup_done") {
          showToast(args[0] ? "success" : "error", args[1] as string);
        } else if (event === "rate_limited") {
          showToast("warning", "GitHub rate limit reached — try again later.", {
            key: "rate-limit",
          });
        }
      }),
    [],
  );

  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DetailCrumb | null>(null);
  const detailStore = useMemo(() => ({ detail, setDetail }), [detail]);
  const pathname = usePathname();
  const router = useRouter();
  const hasLocal = useHasLocalSeasons();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      )
        return;
      if (document.querySelector('[role="dialog"]')) return;
      const intercepted = new CustomEvent("throwback:back", {
        cancelable: true,
      });
      window.dispatchEvent(intercepted);
      if (intercepted.defaultPrevented) return;
      const current = normalizePath(pathname);
      const crumbs = breadcrumbFor(current);
      const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2].href : null;
      if (!parent || normalizePath(parent) === current) return;
      if (normalizePath(parent) === "/" && hasLocal === false) return;
      router.push(parent);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router, hasLocal]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const sidebar = document.getElementById("sidebar");
      const hamburger = document.getElementById("hamburger");
      const target = event.target as Node;
      if (
        sidebar &&
        !sidebar.contains(target) &&
        hamburger &&
        !hamburger.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <DetailContext.Provider value={detailStore}>
      <button
        id="hamburger"
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        aria-controls="sidebar"
        onClick={() => setOpen((value) => !value)}
        className="fixed left-3 top-3 z-[200] hidden flex-col gap-1 rounded-md border border-border bg-surface px-[0.65rem] py-2 max-[56.25em]:flex"
      >
        <span
          className={`block h-0.5 w-[18px] rounded-sm bg-text transition-transform duration-300 ease-in-out ${
            open ? "translate-y-[3px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-[18px] rounded-sm bg-text transition-transform duration-300 ease-in-out ${
            open ? "-translate-y-[3px] -rotate-45" : ""
          }`}
        />
      </button>

      <div className="flex min-h-screen">
        <Sidebar open={open} onNavigate={() => setOpen(false)} />
        <div className="ml-[var(--sidebar-w)] flex min-h-screen flex-1 flex-col max-[56.25em]:ml-0">
          <Topbar />
          <main
            key={pathname}
            className="w-full animate-fade-up px-8 py-6 max-[48em]:p-5 min-[100em]:px-12 min-[100em]:py-10"
          >
            {children}
          </main>
        </div>
      </div>

      <Toasts />
      <BridgeToasts />
      <ScrollReveal />
    </DetailContext.Provider>
  );
}
