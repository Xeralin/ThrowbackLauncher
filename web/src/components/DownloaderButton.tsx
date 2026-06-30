import type { ReactNode } from "react";
import { ExternalLink } from "./ExternalLink";

const base =
  "mb-[0.4rem] mr-2 inline-flex items-center gap-2 rounded-md px-[1.1rem] py-[0.55rem] font-mono text-[0.75rem] tracking-[0.08em] no-underline transition duration-200";

const variants = {
  primary:
    "bg-brand text-white hover:bg-[#a01020] hover:shadow-[0_2px_14px_var(--color-brand-glow)]",
  secondary:
    "border border-border bg-surface-2 text-text-muted hover:bg-border hover:text-text hover:shadow-[0_2px_14px_var(--color-brand-glow)]",
};

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
    </ExternalLink>
  );
}
