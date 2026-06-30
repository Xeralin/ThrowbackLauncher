"use client";

import { useEffect, useState } from "react";
import { BackHeading } from "@/components/BackHeading";
import { Button } from "@/components/Button";
import { Row } from "@/components/SettingsControls";
import { Slider } from "@/components/Slider";
import { useInfo, useSettings } from "@/lib/bridge";

export default function DownloadsPage() {
  const settings = useSettings();
  const info = useInfo();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    const onInvalid = (_field: string, message: string) => {
      setNotice(null);
      setError(message);
    };
    const onCacheCleared = () => {
      setError(null);
      setNotice("Cache cleared");
    };
    settings.invalid_setting.connect(onInvalid);
    settings.cache_cleared.connect(onCacheCleared);
    return () => {
      settings.invalid_setting.disconnect(onInvalid);
      settings.cache_cleared.disconnect(onCacheCleared);
    };
  }, [settings]);

  return (
    <>
      <BackHeading title="Downloads" />

      <div className="max-w-[560px] rounded-lg border border-border bg-surface p-5">
        {!settings ? (
          <p className="font-mono text-ui text-text-muted">Loading…</p>
        ) : (
          <>
            <Row label="Disk usage">
              <span className="text-body text-text">
                {info ? `${info.diskUsageGb} GB` : "—"}
              </span>
            </Row>
            <Row label="Download speed">
              <Slider
                value={settings.max_downloads}
                min={settings.download_bounds.min}
                max={settings.download_bounds.max}
                onCommit={(value) => settings.set_max_downloads(value)}
              />
            </Row>
            <Row label="Download cache">
              <Button
                variant="secondary"
                onClick={() => {
                  setError(null);
                  setNotice(null);
                  settings.clear_cache();
                }}
              >
                Clear cache
              </Button>
            </Row>

            {notice && (
              <p className="mt-3 font-mono text-label text-success">
                {notice}
              </p>
            )}
            {error && (
              <p className="mt-3 font-mono text-label text-brand">{error}</p>
            )}
          </>
        )}
      </div>
    </>
  );
}
