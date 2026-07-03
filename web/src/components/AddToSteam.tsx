"use client";

import { useEffect, useRef, useState } from "react";
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
    "running" | "closing" | "closeFailed" | { protons: ProtonOption[] } | null
  >(null);
  const closingRef = useRef(false);
  const dl = useDownloader();

  useEffect(() => () => {
    closingRef.current = false;
  }, []);

  function begin() {
    dl.isSteamRunning((steamUp) => {
      if (steamUp) {
        setPanel("running");
      } else {
        dl.protonOptions((protons) => setPanel({ protons }));
      }
    });
  }

  function closeSteam() {
    closingRef.current = true;
    setPanel("closing");
    dl.closeSteam();
    let ticks = 0;
    const poll = () => {
      if (!closingRef.current) return;
      dl.isSteamRunning((steamUp) => {
        if (!closingRef.current) return;
        if (!steamUp) {
          closingRef.current = false;
          dl.protonOptions((protons) => setPanel({ protons }));
        } else if (ticks++ >= 30) {
          closingRef.current = false;
          setPanel("closeFailed");
        } else {
          window.setTimeout(poll, 500);
        }
      });
    };
    window.setTimeout(poll, 500);
  }

  function dismiss() {
    closingRef.current = false;
    setPanel(null);
  }

  return (
    <>
      <Button
        variant={again ? "secondary" : "primary"}
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
          confirmLabel="Continue"
          onConfirm={closeSteam}
          onCancel={() => setPanel(null)}
        >
          <p className="text-body text-text-muted">
            Steam is still running. Close it to continue?
          </p>
        </ConfirmModal>
      )}

      {panel === "closing" && (
        <Dialog title="Add to Steam" onClose={dismiss}>
          <p className="text-body text-text-muted">Closing Steam…</p>
        </Dialog>
      )}

      {panel === "closeFailed" && (
        <ConfirmModal
          title="Add to Steam"
          confirmLabel="Try again"
          onConfirm={closeSteam}
          onCancel={() => setPanel(null)}
        >
          <p className="text-body text-text-muted">
            Steam did not close. Close it manually, then try again.
          </p>
        </ConfirmModal>
      )}

      {panel && typeof panel === "object" && (
        <Dialog
          title="Add to Steam"
          onClose={() => setPanel(null)}
          footer={
            <Button variant="secondary" onClick={() => setPanel(null)}>
              Cancel
            </Button>
          }
        >
          <p className="mb-4 text-body text-text-muted">
            Pick a compatibility layer
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
