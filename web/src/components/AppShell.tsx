"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ScrollReveal } from "./ScrollReveal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
    <>
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
            className="w-full animate-fade-up p-8 max-[48em]:p-5 min-[100em]:px-12 min-[100em]:py-10"
          >
            {children}
          </main>
        </div>
      </div>

      <ScrollReveal />
    </>
  );
}
