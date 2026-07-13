"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackHeading } from "@/components/BackHeading";
import { Button, buttonBase } from "@/components/Button";
import { useRadmin } from "@/lib/bridge";
import { showToast } from "@/lib/toast";

const BLUE = "#2ea8e0";

export default function RadminPage() {
  const router = useRouter();
  const [phase, setPhase] = useState("");
  const radmin = useRadmin({
    onLog: (line) => setPhase(line),
    onError: (message) => showToast("error", message),
  });

  const running = radmin.status === "running";
  const connecting = radmin.status === "connecting";
  const canConnect = (radmin.hasInstaller || radmin.installed) && !radmin.busy;

  const connect = () => {
    setPhase("");
    radmin.start();
  };

  const statusLabel = running
    ? "Connected"
    : connecting
      ? "Connecting"
      : "Not connected";

  return (
    <>
      <BackHeading title="Bridge" onBack={() => router.push("/settings")} />

      {!radmin.ready ? (
        <p className="font-mono text-ui text-text-muted">Loading…</p>
      ) : (
        <div className="flex max-w-[720px] flex-col gap-6">
          <p className="max-w-[580px] text-body leading-relaxed text-text-muted">
            Bridge runs RadminVPN natively through Wine, so you can join VPN
            networks and play with others on Linux without a virtual machine.
          </p>

          <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full transition-colors"
                  style={{
                    background: running || connecting ? BLUE : "#3a3b45",
                    boxShadow: running ? `0 0 10px ${BLUE}` : "none",
                  }}
                />
                <div className="flex flex-col">
                  <span className="font-display text-[1.35rem] font-bold text-text">
                    {statusLabel}
                  </span>
                  {running && (
                    <span className="font-mono text-label text-text-muted">
                      {radmin.ip}
                    </span>
                  )}
                </div>
              </div>
              {running ? (
                <Button
                  variant="secondary"
                  destructive
                  onClick={() => radmin.stop()}
                >
                  Disconnect
                </Button>
              ) : (
                <button
                  type="button"
                  disabled={!canConnect}
                  onClick={connect}
                  className={`${buttonBase} justify-center py-[0.55rem] text-white transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40`}
                  style={{ background: BLUE }}
                >
                  {connecting ? "Connecting…" : "Connect"}
                </button>
              )}
            </div>

            {connecting && (
              <div className="flex flex-col gap-2.5">
                <span className="font-mono text-label text-text-muted">
                  {phase || "Starting…"}
                </span>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="absolute inset-y-0 left-0 w-1/4 rounded-full"
                    style={{
                      background: BLUE,
                      boxShadow: `0 0 10px ${BLUE}80`,
                      animation: "bridgeSweep 1.15s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-display text-[1.05rem] font-bold text-text">
                  RadminVPN installer
                </span>
                <span className="font-mono text-label text-text-muted">
                  {radmin.installed
                    ? "Installed"
                    : radmin.hasInstaller
                      ? "Selected"
                      : "Not selected"}
                </span>
              </div>
              <Button
                variant="secondary"
                disabled={radmin.busy}
                onClick={() => radmin.selectInstaller()}
              >
                {radmin.installed || radmin.hasInstaller
                  ? "Change"
                  : "Select installer"}
              </Button>
            </div>
            <p className="text-label leading-relaxed text-text-muted">
              Download the RadminVPN installer for Windows from radmin-vpn.com,
              then select the .exe here.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
