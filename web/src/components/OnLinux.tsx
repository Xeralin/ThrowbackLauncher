"use client";

import type { ReactNode } from "react";
import { usePlatform } from "@/lib/bridge";

export function OnLinux({ children }: { children: ReactNode }) {
  return usePlatform() === "linux" ? <>{children}</> : null;
}
