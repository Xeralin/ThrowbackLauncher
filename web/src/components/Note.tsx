import type { ReactNode } from "react";

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="w-fit rounded-r-[4px] border-l-[3px] border-l-accent bg-[#0d0d00] px-[0.9rem] py-[0.6rem] text-[0.83rem] leading-[1.5] text-[#c8b060] [&_a]:text-[#f0c040] [&_a]:underline [&_a:hover]:text-[#ffd966]">
      {children}
    </div>
  );
}
