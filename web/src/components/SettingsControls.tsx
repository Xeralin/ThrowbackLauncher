"use client";

import { useState, type ReactNode } from "react";

export function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[2.75rem] items-center justify-between gap-4">
      <span className="font-display text-[1.05rem] font-bold text-text">
        {label}
      </span>
      {children}
    </div>
  );
}

export const inputClasses =
  "rounded-md border border-border bg-surface-2 px-3 text-text outline-none placeholder:text-text-muted focus:border-brand";

export function TextSetting({
  value,
  placeholder,
  onCommit,
  className = "w-[230px]",
}: {
  value: string;
  placeholder?: string;
  onCommit: (value: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setDraft(value);
  }

  return (
    <input
      value={draft}
      placeholder={placeholder}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={`${className} ${inputClasses} py-[0.4rem] text-body`}
    />
  );
}
