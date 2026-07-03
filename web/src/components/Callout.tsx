import type { ReactNode } from "react";

type CalloutProps = {
  variant?: "notice" | "warning";
  label: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

const linkClasses =
  "[&_a]:text-[#f0c040] [&_a]:underline [&_a:hover]:text-[#ffd966]";

const variantClasses: Record<
  NonNullable<CalloutProps["variant"]>,
  { box: string; label: string }
> = {
  notice: {
    box: "animate-notice-pulse border-[#3a3000] border-l-[3px] border-l-accent bg-[#0d0d00] text-[#c8b060]",
    label: "text-accent",
  },
  warning: {
    box: "animate-warning-pulse border-[#3a0000] border-l-[3px] border-l-brand bg-[#0d0000] text-[#c86060]",
    label: "text-brand",
  },
};

export function Callout({
  variant = "notice",
  label,
  children,
  className = "mb-6",
  compact = false,
}: CalloutProps) {
  const styles = variantClasses[variant];
  return (
    <div
      className={`${className} rounded-md border leading-[1.5] ${
        compact
          ? "px-[0.8rem] py-[0.4rem] text-[0.85rem]"
          : "px-[1.1rem] py-[0.9rem] text-[0.85rem]"
      } ${linkClasses} ${styles.box}`}
    >
      <strong
        className={`block font-mono tracking-[0.1em] ${
          compact ? "mb-[0.1rem] text-[0.6rem]" : "mb-[0.3rem] text-[0.72rem]"
        } ${styles.label}`}
      >
        {label}
      </strong>
      {children}
    </div>
  );
}
