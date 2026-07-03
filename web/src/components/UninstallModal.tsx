"use client";

import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useUninstall, type Season, type UninstallTargets } from "@/lib/bridge";
import { showToast } from "@/lib/toast";

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

type ItemId = "files" | "prefix" | "shortcut";

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
  const [itemBusy, setItemBusy] = useState<ItemId | null>(null);

  const un = useUninstall({
    onFinished: (ok, message) => {
      setBusy(false);
      if (ok) {
        onDone();
        onClose();
      } else {
        showToast("error", message);
      }
    },
    onItemFinished: (item, ok, message) => {
      setItemBusy(null);
      if (!ok) {
        showToast("error", message);
        return;
      }
      showToast("success", message);
      if (item === "files") {
        onDone();
        onClose();
        return;
      }
      un.preview(season.key, setTargets);
    },
  });

  useEffect(() => {
    if (un.ready) un.preview(season.key, setTargets);
  }, [un, season.key]);

  function confirm() {
    setBusy(true);
    un.run(season.key);
  }

  function deleteItem(item: ItemId) {
    setItemBusy(item);
    un.runItem(season.key, item);
  }

  const blocked = busy || itemBusy !== null;

  const items: { id: ItemId; label: string; sub?: string }[] = [
    { id: "files", label: "Game files", sub: targets?.folder },
    ...(targets?.prefix
      ? [{ id: "prefix" as ItemId, label: "Proton prefix" }]
      : []),
    ...(targets?.shortcut
      ? [{ id: "shortcut" as ItemId, label: "Steam shortcut" }]
      : []),
  ];

  return (
    <ConfirmModal
      title={`Uninstall ${season.name}`}
      confirmLabel="Uninstall"
      busyLabel={busy ? "Removing…" : undefined}
      busy={blocked}
      destructive
      onConfirm={confirm}
      onCancel={onClose}
    >
      <p className="mb-4 text-body text-text-muted">
        This permanently deletes:
      </p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-2.5 text-body text-text"
          >
            <button
              type="button"
              aria-label={`Delete ${item.label}`}
              disabled={blocked}
              onClick={() => deleteItem(item.id)}
              className="mt-[3px] text-brand transition-colors hover:text-[#e0405a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <TrashIcon />
            </button>
            <span className="min-w-0">
              {item.label}
              {item.sub && (
                <span className="mt-0.5 block break-all font-mono text-label text-text-muted">
                  {item.sub}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </ConfirmModal>
  );
}
