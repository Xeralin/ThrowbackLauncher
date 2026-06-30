"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";

export function ConfirmModal({
  title,
  confirmLabel,
  busyLabel,
  busy = false,
  confirmDisabled = false,
  destructive = false,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  confirmDisabled?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <Dialog
      title={title}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            destructive={destructive}
            disabled={busy || confirmDisabled}
            onClick={onConfirm}
          >
            {busy && busyLabel ? busyLabel : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
