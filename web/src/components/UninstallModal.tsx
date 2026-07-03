"use client";

import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { TrashIcon } from "@/components/TrashIcon";
import { useUninstall, type Season, type UninstallTargets } from "@/lib/bridge";
import { showToast } from "@/lib/toast";

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
    onDone: (ok, message) => {
      setBusy(false);
      if (ok) {
        onDone();
        onClose();
      } else {
        showToast("error", message);
      }
    },
    onItemDone: (item, ok, message) => {
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
        This permanently deletes the items below.
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
              <TrashIcon className="h-3.5 w-3.5" />
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
