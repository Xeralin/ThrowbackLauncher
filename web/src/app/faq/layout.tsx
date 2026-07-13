"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { PlatformSwitch } from "@/components/PlatformSwitch";
import { PlatformViewProvider } from "@/lib/platform-view";

const noopSubscribe = () => () => {};
const getTopbarSlot = () => document.getElementById("topbar-actions");
const getServerSlot = () => null;

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  const slot = useSyncExternalStore(
    noopSubscribe,
    getTopbarSlot,
    getServerSlot,
  );

  return (
    <PlatformViewProvider>
      {slot && createPortal(<PlatformSwitch />, slot)}
      {children}
    </PlatformViewProvider>
  );
}
