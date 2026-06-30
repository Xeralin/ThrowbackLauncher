"use client";

import { SeasonBrowser } from "@/components/SeasonBrowser";
import { useHomeSeasons } from "@/lib/bridge";

export function HomeView() {
  return (
    <SeasonBrowser
      seasons={useHomeSeasons()}
      emptyMessage="No seasons installed yet — open Download to get one."
      layout="dashboard"
    />
  );
}
