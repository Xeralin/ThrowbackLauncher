"use client";

import { SeasonBrowser } from "@/components/SeasonBrowser";
import { useSeasons } from "@/lib/bridge";

export function DownloadView() {
  return (
    <SeasonBrowser
      seasons={useSeasons()}
      emptyMessage="No seasons available."
      searchable
    />
  );
}
