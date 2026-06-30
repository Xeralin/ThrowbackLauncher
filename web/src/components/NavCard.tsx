import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink } from "./ExternalLink";

export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="card-grid mb-8 grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4 max-[48em]:grid-cols-2 max-[32.5em]:grid-cols-1">
      {children}
    </div>
  );
}

type NavCardProps = {
  href?: string;
  external?: boolean;
  title: ReactNode;
  desc: ReactNode;
  arrow: string;
  wip?: boolean;
};

export function NavCard({
  href,
  external,
  title,
  desc,
  arrow,
  wip,
}: NavCardProps) {
  const className = `nav-card group relative flex flex-col gap-2 overflow-hidden rounded-lg border border-border bg-surface p-5 text-text no-underline transition-[border-color,background-color,box-shadow] duration-200 hover:border-border-brand hover:bg-surface-2 card-glow-hover${
    wip ? " pointer-events-none opacity-50" : ""
  }`;

  const inner = (
    <>
      <h3 className="font-display text-[1.05rem] font-bold text-text">
        {title}
      </h3>
      <div className="flex-1 text-[0.82rem] leading-[1.5] text-text-muted">
        {desc}
      </div>
      <div className="mt-auto font-mono text-[0.7rem] tracking-[0.1em] text-brand">
        {arrow}
      </div>
    </>
  );

  if (wip || !href) {
    return <div className={className}>{inner}</div>;
  }

  if (external) {
    return (
      <ExternalLink href={href} className={className}>
        {inner}
      </ExternalLink>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
