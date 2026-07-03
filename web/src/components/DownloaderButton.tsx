import type { ReactNode } from "react";
import { ExternalLink } from "./ExternalLink";

const base =
  "mb-[0.4rem] mr-2 inline-flex items-center gap-2 rounded-md px-[1.1rem] font-mono text-[0.75rem] tracking-[0.08em] no-underline shadow-[0_2px_14px_transparent] transition duration-200";

const variants = {
  primary:
    "bg-brand py-[0.55rem] text-white hover:bg-[#a01020] hover:shadow-[0_2px_14px_var(--color-brand-glow)]",
  secondary:
    "border border-border bg-surface-2 py-[calc(0.55rem-1px)] text-text-muted hover:bg-border hover:text-text hover:shadow-[0_2px_14px_var(--color-brand-glow)]",
};

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export function DownloaderButton({
  href,
  secondary,
  download,
  children,
}: {
  href: string;
  secondary?: boolean;
  download?: string;
  children: ReactNode;
}) {
  const className = `${base} ${secondary ? variants.secondary : variants.primary}`;
  if (download) {
    return (
      <a href={href} download={download} className={className}>
        {children}
      </a>
    );
  }
  return (
    <ExternalLink href={href} className={className}>
      {children}
      <ExternalIcon />
    </ExternalLink>
  );
}
