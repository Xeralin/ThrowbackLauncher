"use client";

import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useUninstall, type Season, type UninstallTargets } from "@/lib/bridge";

export function UninstallModal({
  season,
  onClose,
  onDone,
}: {
  season: Season;
  onClose: () => void;
  onDone: () => void;
}) {
  const [targets, setTargets] = useState<UninstallTargets | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const un = useUninstall({
    onFinished: (ok, message) => {
      setBusy(false);
      if (ok) {
        onDone();
        onClose();
      } else {
        setError(message);
      }
    },
  });

  useEffect(() => {
    if (un.ready) un.preview(season.key, setTargets);
  }, [un, season.key]);

  function confirm() {
    setError(null);
    setBusy(true);
    un.run(season.key);
  }

  return (
    <ConfirmModal
      title={`Uninstall ${season.name}`}
      confirmLabel="Uninstall"
      busyLabel="Removing…"
      busy={busy}
      destructive
      onConfirm={confirm}
      onCancel={onClose}
    >
      <p className="mb-3 text-body text-text-muted">This permanently deletes:</p>
      <ul className="mb-3 flex flex-col gap-1 text-ui text-text">
        <li>· Game files</li>
        {targets?.prefix && <li>· Proton prefix</li>}
        {targets?.shortcut && <li>· Steam shortcut</li>}
      </ul>
      {targets && (
        <p className="mb-3 break-all font-mono text-label text-text-muted">
          {targets.folder}
        </p>
      )}
      {targets?.prefix && (
        <p className="mb-3 font-mono text-label text-text-muted">
          Close Steam first so the shortcut removal sticks.
        </p>
      )}
      {error && <p className="font-mono text-label text-brand">{error}</p>}
    </ConfirmModal>
  );
}
