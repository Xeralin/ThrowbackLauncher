import type { CSSProperties, ReactNode } from "react";

type TagVariant = "default" | "red" | "liberator" | "hm" | "rework";

const VARIANTS: Record<Exclude<TagVariant, "hm">, string> = {
  default: "border-border bg-surface-2 text-text-muted",
  red: "border-[#3a1020] bg-[#1a0808] text-[#c06060]",
  liberator: "border-[#3a3a3a] bg-[#1a1a1a] text-[#e8e8e8]",
  rework: "border-[#243c52] bg-[#0c1a26] text-[#79a6d6]",
};

const HM_BOX: CSSProperties = {
  background:
    "linear-gradient(to bottom, #b00404, #400202 50%, #0c0000) padding-box, " +
    "linear-gradient(to bottom, #0c0000, #400202 50%, #b00404) border-box",
  borderColor: "transparent",
};

const HM_TEXT: CSSProperties = {
  display: "inline-block",
  backgroundImage:
    "linear-gradient(to bottom, #ffffff 10%, #b8b8b8 50%, #5e5e5e 92%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
};

function sizeClasses(size: "sm" | "md") {
  return `rounded-[3px] border px-[0.4rem] py-[0.1rem] font-mono ${
    size === "md" ? "text-label" : "text-[0.6rem]"
  }`;
}

export function Tag({
  variant = "default",
  size = "sm",
  children,
}: {
  variant?: TagVariant;
  size?: "sm" | "md";
  children: ReactNode;
}) {
  if (variant === "hm") {
    return (
      <span className={sizeClasses(size)} style={HM_BOX}>
        <span style={HM_TEXT}>{children}</span>
      </span>
    );
  }
  return (
    <span className={`${sizeClasses(size)} ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}

const SPLIT_COLORS: Record<
  "green" | "amber" | "purple",
  { text: string; border: string; bg: string }
> = {
  green: { text: "#6abf6a", border: "#1a3a1a", bg: "#0a1a0a" },
  amber: { text: "#c8a840", border: "#3a3000", bg: "#1a1500" },
  purple: { text: "#b47ad4", border: "#2a1a3a", bg: "#140a1a" },
};

export function SplitTag({
  left,
  right,
  variant,
  size = "sm",
}: {
  left: ReactNode;
  right: ReactNode;
  variant: "green" | "amber" | "purple";
  size?: "sm" | "md";
}) {
  const colors = SPLIT_COLORS[variant];
  return (
    <span
      className={`inline-flex items-center gap-[0.55em] ${sizeClasses(size)}`}
      style={{
        backgroundImage: `linear-gradient(to right, var(--color-surface-2), ${colors.bg})`,
        borderColor: colors.border,
      }}
    >
      <span className="text-text-muted">{left}</span>
      <span style={{ color: colors.text }}>{right}</span>
    </span>
  );
}
