"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export const buttonBase =
  "inline-flex items-center gap-2 rounded-md px-[1.1rem] text-[0.85rem] font-medium transition duration-200";

export const buttonVariants = {
  primary:
    "bg-brand py-[0.55rem] text-white hover:bg-[#a01020] hover:shadow-[0_2px_14px_var(--color-brand-glow)]",
  secondary:
    "border border-border bg-surface-2 py-[calc(0.55rem-1px)] text-text-muted hover:bg-border hover:text-text hover:shadow-[0_2px_14px_var(--color-brand-glow)]",
};

const base = `${buttonBase} justify-center disabled:cursor-not-allowed disabled:opacity-40`;

export function Button({
  variant = "secondary",
  destructive = false,
  className = "",
  children,
  ...props
}: {
  variant?: "primary" | "secondary";
  destructive?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const tone =
    destructive && variant !== "primary"
      ? "text-brand hover:text-[#e0405a]"
      : "";
  return (
    <button
      className={`${base} ${buttonVariants[variant]} ${tone} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
