"use client";

import { useEffect, useRef, useState } from "react";

export function InfoHint({
  text,
  align = "right",
}: {
  text: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onDown);

    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <span ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        aria-label="Info"
        onClick={() => setOpen((value) => !value)}
        className="flex flex-shrink-0 text-text-muted transition-colors hover:text-text"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="16" y2="12" />
          <line x1="12" x2="12.01" y1="8" y2="8" />
        </svg>
      </button>
      {open && (
        <span
          className={`absolute top-full z-20 mt-1.5 w-60 rounded-md border border-border bg-surface-2 px-3 py-2 text-left text-ui leading-snug text-text shadow-lg ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
