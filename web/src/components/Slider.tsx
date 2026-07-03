"use client";

import { useState } from "react";

export function Slider({
  value,
  min,
  max,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(value);
  const fill = ((draft - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={draft}
        onChange={(event) => setDraft(Number(event.target.value))}
        onPointerUp={() => onCommit(draft)}
        onKeyUp={() => onCommit(draft)}
        style={{
          background: `linear-gradient(to right, var(--color-brand) ${fill}%, var(--color-surface-2) ${fill}%)`,
        }}
        className="range-slider h-1 w-[200px] cursor-pointer rounded-full outline-none"
      />
      <span className="w-[3ch] text-right font-mono text-body text-text">
        {draft}
      </span>
    </div>
  );
}
