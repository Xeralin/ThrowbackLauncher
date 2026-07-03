"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function Dialog({
  title,
  children,
  footer,
  onClose,
}: {
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
}) {
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!onClose) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose?.();
      }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 animate-fade-in"
    >
      <div className="animate-fade-up">
        <div className="max-h-[calc(100dvh-3rem)] w-[440px] overflow-y-auto rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-2 font-display text-[1.2rem] font-semibold text-text">
            {title}
          </h2>
          {children}
          {footer && (
            <div className="mt-5 flex justify-end gap-2">{footer}</div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
