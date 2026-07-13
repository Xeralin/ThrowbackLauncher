"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePlatform, type ThrowbackOS } from "@/lib/bridge";

const PlatformViewContext = createContext<{
  platform: ThrowbackOS | null;
  setPlatform: (platform: ThrowbackOS) => void;
} | null>(null);

export function PlatformViewProvider({ children }: { children: ReactNode }) {
  const os = usePlatform();
  const [override, setOverride] = useState<ThrowbackOS | null>(null);
  const store = useMemo(
    () => ({ platform: override ?? os, setPlatform: setOverride }),
    [override, os],
  );
  return (
    <PlatformViewContext.Provider value={store}>
      {children}
    </PlatformViewContext.Provider>
  );
}

export function usePlatformView(): ThrowbackOS | null {
  const view = useContext(PlatformViewContext);
  const os = usePlatform();
  return view ? view.platform : os;
}

export function usePlatformViewStore() {
  return useContext(PlatformViewContext);
}
