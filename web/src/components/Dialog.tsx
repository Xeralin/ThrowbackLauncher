"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/Modal";

export function Dialog({
  title,
  width = "default",
  children,
  footer,
}: {
  title: string;
  width?: "default" | "wide";
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Modal>
      <div
        className={`${
          width === "wide" ? "w-[520px]" : "w-[440px]"
        } rounded-lg border border-border bg-surface p-6`}
      >
        <h2 className="mb-4 font-display text-[1.2rem] font-semibold text-text">
          {title}
        </h2>
        {children}
        {footer && (
          <div className="mt-5 flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </Modal>
  );
}
