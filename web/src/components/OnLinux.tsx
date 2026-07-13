"use client";

import type { ReactNode } from "react";
import { usePlatformView } from "@/lib/platform-view";

export function OnLinux({ children }: { children: ReactNode }) {
  return usePlatformView() === "linux" ? <>{children}</> : null;
}
