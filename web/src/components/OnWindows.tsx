"use client";

import type { ReactNode } from "react";
import { usePlatformView } from "@/lib/platform-view";

export function OnWindows({ children }: { children: ReactNode }) {
  return usePlatformView() === "windows" ? <>{children}</> : null;
}
