import type { ReactNode } from "react";

export type TagVariant = "default" | "green";

const variants: Record<TagVariant, string> = {
  default: "border-border bg-surface-2 text-text-muted",
  green: "border-[#1a3a1a] bg-[#0a1a0a] text-[#6abf6a]",
};

export function Tag({
  variant = "default",
  color,
  children,
}: {
  variant?: TagVariant;
  color?: string;
  children: ReactNode;
}) {
  if (color) {
    return (
      <span
        className="rounded-[3px] border px-[0.4rem] py-[0.1rem] font-mono text-[0.6rem]"
        style={{
          color: `color-mix(in srgb, ${color} 62%, white)`,
          backgroundColor: `color-mix(in srgb, ${color} 18%, var(--color-bg))`,
          borderColor: `color-mix(in srgb, ${color} 45%, var(--color-bg))`,
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={`rounded-[3px] border px-[0.4rem] py-[0.1rem] font-mono text-[0.6rem] ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
