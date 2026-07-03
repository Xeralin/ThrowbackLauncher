"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import {
  useShears,
  type Season,
  type ShearsKind,
  type ShearsScan,
} from "@/lib/bridge";
import { showToast } from "@/lib/toast";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exp;
  const text = exp === 0 || value >= 100 ? Math.round(value) : value.toFixed(1);
  return `${text} ${units[exp]}`;
}

export function ShearsModal({
  season,
  onClose,
}: {
  season: Season;
  onClose: () => void;
}) {
  const shears = useShears();
  const [scan, setScan] = useState<ShearsScan | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (shears.ready) shears.scan(season.key, setScan);
  }, [shears, season.key]);

  function cut(kind: ShearsKind, level: number) {
    setBusy(true);
    shears.cut(season.key, kind, level, (result) => {
      setBusy(false);
      if (result.ok) {
        setScan(result.scan);
        showToast(
          "success",
          result.freed > 0
            ? `Freed ${formatBytes(result.freed)}`
            : "Nothing to remove",
        );
      } else {
        showToast("error", result.message);
      }
    });
  }

  const tiers = scan?.tiers ?? [];
  const videos = scan?.videos ?? 0;
  const events = scan?.events ?? 0;
  const actions: {
    key: string;
    label: string;
    freed: number;
    run: () => void;
  }[] = [];
  if (videos > 0) {
    actions.push({
      key: "videos",
      label: "Videos",
      freed: videos,
      run: () => cut("videos", 0),
    });
  }
  if (events > 0) {
    actions.push({
      key: "events",
      label: "Events",
      freed: events,
      run: () => cut("events", 0),
    });
  }
  for (let k = 0; k < tiers.length - 1; k++) {
    const freed = tiers.slice(k + 1).reduce((sum, t) => sum + t.size, 0);
    actions.push({
      key: `tex-${tiers[k].level}`,
      label: `Textures · keep ${tiers[k].quality}`,
      freed,
      run: () => cut("textures", tiers[k].level),
    });
  }

  return (
    <Dialog
      title="Shears"
      onClose={busy ? undefined : onClose}
      footer={
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Close
        </Button>
      }
    >
      {scan && (
        <p className="mb-4 text-body text-text-muted">
          {formatBytes(scan.total)} on disk
        </p>
      )}

      {!scan ? (
        <p className="font-mono text-ui text-text-muted">Scanning…</p>
      ) : actions.length === 0 ? (
        <p className="font-mono text-ui text-text-muted">Nothing to cut.</p>
      ) : (
        <div className="flex flex-col">
          {actions.map((action) => (
            <div
              key={action.key}
              className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
            >
              <span className="text-body text-text">{action.label}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-ui text-text-muted">
                  {formatBytes(action.freed)}
                </span>
                <Button
                  variant="secondary"
                  destructive
                  disabled={busy}
                  onClick={action.run}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
