"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Dialog } from "@/components/Dialog";
import { useDownloader, type ProtonOption, type Season } from "@/lib/bridge";

export function AddToSteamButton({
  season,
  again = false,
}: {
  season: Season;
  again?: boolean;
}) {
  const [panel, setPanel] = useState<
    "running" | { protons: ProtonOption[] } | null
  >(null);
  const dl = useDownloader();

  function begin() {
    dl.isSteamRunning((steamUp) => {
      if (steamUp) {
        setPanel("running");
      } else {
        dl.protonOptions((protons) => setPanel({ protons }));
      }
    });
  }

  return (
    <>
      <Button
        variant={again ? "secondary" : "primary"}
        disabled={dl.running}
        onClick={(event) => {
          event.stopPropagation();
          begin();
        }}
      >
        {again ? "Add to Steam again" : "Add to Steam"}
      </Button>

      {panel === "running" && (
        <ConfirmModal
          title="Add to Steam"
          confirmLabel="Retry"
          onConfirm={begin}
          onCancel={() => setPanel(null)}
        >
          <p className="text-body text-text-muted">
            Close Steam completely to apply, then retry.
          </p>
        </ConfirmModal>
      )}

      {panel && panel !== "running" && (
        <Dialog
          title="Add to Steam"
          onClose={() => setPanel(null)}
          footer={
            <Button variant="secondary" onClick={() => setPanel(null)}>
              Cancel
            </Button>
          }
        >
          <p className="mb-3 text-body text-text-muted">
            Pick a Proton version:
          </p>
          {panel.protons.length === 0 ? (
            <p className="font-mono text-ui text-text-muted">
              No Proton found.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {panel.protons.map((proton) => (
                <button
                  key={proton.index}
                  onClick={() => {
                    dl.steamSetup(season.key, proton.index);
                    setPanel(null);
                  }}
                  className="rounded-md border border-border bg-surface-2 px-3 py-2 text-left text-body text-text transition hover:border-border-brand hover:bg-border"
                >
                  {proton.display}
                </button>
              ))}
            </div>
          )}
        </Dialog>
      )}
    </>
  );
}
