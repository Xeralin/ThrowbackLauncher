import Image from "next/image";
import type { ReactNode } from "react";
import { site } from "@/config/site";

type HeroProps = {
  tag: string;
  corner: string;
  title: ReactNode;
  description: string;
};

export function Hero({ tag, corner, title, description }: HeroProps) {
  return (
    <div className="relative mb-8 flex min-h-[160px] overflow-hidden rounded-[10px] border border-border-brand bg-[linear-gradient(135deg,#0d0d0f_0%,#1a0810_50%,#0d0d0f_100%)] before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:rounded-[inherit] before:bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.06)_2px,rgba(0,0,0,0.06)_4px)] before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:z-[3] after:h-[60px] after:animate-scan-move after:bg-[linear-gradient(transparent,rgba(192,21,42,0.025)_50%,transparent)] after:content-['']">
      <Image
        src={site.ogImage}
        alt=""
        fill
        sizes="100vw"
        priority
        className="pointer-events-none select-none object-cover object-center opacity-[0.28]"
      />
      <div className="absolute inset-0 animate-hero-glow bg-[radial-gradient(ellipse_at_70%_50%,var(--color-brand-glow)_0%,transparent_65%)]" />
      <div className="relative z-[2] flex flex-1 flex-col justify-center px-10 py-7 max-[48em]:px-6 max-[48em]:py-5">
        <div className="mb-[0.6rem] flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-brand before:h-px before:w-5 before:bg-brand before:content-['']">
          {tag}
        </div>
        <h1 className="mb-2 font-display text-[2.4rem] font-bold leading-none text-text max-[48em]:text-[1.9rem] max-[32.5em]:text-[1.6rem] min-[100em]:text-[2.8rem] [&_em]:not-italic [&_em]:text-brand">
          {title}
        </h1>
        <p className="max-w-full text-[0.9rem] leading-[1.6] text-text-muted">
          {description}
        </p>
      </div>
      <div className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 animate-flicker select-none font-display text-[7rem] font-bold leading-none text-[rgba(192,21,42,0.22)] max-[48em]:hidden">
        {corner}
      </div>
    </div>
  );
}
