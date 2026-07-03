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

  const removes = [
    "Game files",
    ...(targets?.prefix ? ["Proton prefix"] : []),
    ...(targets?.shortcut ? ["Steam shortcut"] : []),
  ];

  return (
    <ConfirmModal
      title="Uninstall"
      confirmLabel="Uninstall"
      busyLabel="Removing…"
      busy={busy}
      destructive
      onConfirm={confirm}
      onCancel={onClose}
    >
      <p className="mb-4 text-body text-text-muted">
        {season.name} · This permanently deletes:
      </p>
      <ul className="mb-4 flex flex-col gap-1.5">
        {removes.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2.5 text-body text-text"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            {item}
          </li>
        ))}
      </ul>
      {targets && (
        <p className="break-all font-mono text-label text-text-muted">
          {targets.folder}
        </p>
      )}
      {error && <p className="mt-3 font-mono text-label text-brand">{error}</p>}
    </ConfirmModal>
  );
}
