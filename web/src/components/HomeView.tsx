"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SeasonBrowser } from "@/components/SeasonBrowser";
import { onBridgeEvent, useHomeSeasons } from "@/lib/bridge";

export function HomeView() {
  const [seasons, refresh] = useHomeSeasons();

  useEffect(
    () =>
      onBridgeEvent("downloader", (event, args) => {
        if (event === "steam_setup_done" && args[0]) refresh();
      }),
    [refresh],
  );

  return (
    <SeasonBrowser
      seasons={seasons}
      emptyMessage={
        <>
          No seasons installed yet — grab your first one from the{" "}
          <Link href="/download">Download</Link> tab.
        </>
      }
      layout="dashboard"
      onReturn={refresh}
    />
  );
}
