"use client";

import { useEffect, useRef } from "react";

export type LogLine = { id: number; text: string };

export function LogBox({
  lines,
  className,
  follow = false,
}: {
  lines: LogLine[];
  className: string;
  follow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!follow) return;
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [follow, lines]);

  return (
    <div
      ref={ref}
      className={`overflow-auto rounded-lg border border-border bg-[#0c0c0f] p-3 font-mono text-label leading-[1.5] text-text-muted ${className}`}
    >
      {lines.map((line) => (
        <div key={line.id} className="whitespace-pre-wrap break-words">
          {line.text}
        </div>
      ))}
    </div>
  );
}
