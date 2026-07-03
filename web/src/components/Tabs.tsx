"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type TabItem<T extends string> = {
  id: T;
  label: string;
  disabled?: boolean;
};

export function Tabs<T extends string>({
  tabs,
  active,
  onSelect,
  trailing,
}: {
  tabs: TabItem<T>[];
  active: T | null;
  onSelect: (id: T) => void;
  trailing?: ReactNode;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useIsoLayoutEffect(() => {
    const el = active ? refs.current[active] : null;
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);

  useEffect(() => {
    function remeasure() {
      const el = active ? refs.current[active] : null;
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    window.addEventListener("resize", remeasure);
    document.fonts?.ready.then(remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, [active]);

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 border-b border-border">
      <div className="relative flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            type="button"
            disabled={tab.disabled}
            onClick={() => onSelect(tab.id)}
            className={`px-4 py-2 font-mono text-label uppercase tracking-[0.12em] transition-colors ${
              active === tab.id
                ? "text-text"
                : tab.disabled
                  ? "cursor-not-allowed text-text-muted/40"
                  : "text-text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[-1px] h-[2px] bg-brand transition-[left,width] duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>
      {trailing && (
        <span className="pb-2 font-display text-[1.05rem] font-bold text-text">
          {trailing}
        </span>
      )}
    </div>
  );
}
