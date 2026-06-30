"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-[1.1rem] py-[0.55rem] font-mono text-[0.75rem] tracking-[0.08em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-40";

const variants = {
  primary:
    "bg-brand text-white hover:bg-[#a01020] hover:shadow-[0_2px_14px_var(--color-brand-glow)]",
  secondary:
    "border border-border bg-surface-2 text-text-muted hover:bg-border hover:text-text hover:shadow-[0_2px_14px_var(--color-brand-glow)]",
  ghost: "text-text-muted hover:text-text",
};

export function Button({
  variant = "secondary",
  destructive = false,
  className = "",
  children,
  ...props
}: {
  variant?: "primary" | "secondary" | "ghost";
  destructive?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const tone =
    destructive && variant !== "primary" ? "text-brand hover:text-[#e0405a]" : "";
  return (
    <button
      className={`${base} ${variants[variant]} ${tone} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
