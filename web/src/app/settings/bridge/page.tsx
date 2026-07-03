"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackHeading } from "@/components/BackHeading";
import { Callout } from "@/components/Callout";
import { inputClasses } from "@/components/SettingsControls";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { useRadmin, usePlatform } from "@/lib/bridge";
import { showToast } from "@/lib/toast";

const IP_PATTERN = /^26\.\d+\.\d+\.\d+$/;

function StatusChip({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <span className="flex items-center justify-between gap-6 rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
      <span className="font-display text-[1.05rem] font-bold text-text">
        {label}
      </span>
      <span className="flex items-center gap-1.5 font-mono text-label text-text">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? "bg-success" : "bg-brand"}`}
        />
        {value}
      </span>
    </span>
  );
}

export default function MultiplayerPage() {
  const os = usePlatform();
  const radmin = useRadmin({
    onResult: (ok, text) => showToast(ok ? "success" : "error", text),
  });

  const router = useRouter();
  const [ipEdit, setIpEdit] = useState<string | null>(null);
  const [vmDialog, setVmDialog] = useState<string[] | "loading" | null>(null);

  const ip = ipEdit ?? radmin.radminIp;
  const busy = radmin.busy;
  const ipValid = IP_PATTERN.test(ip.trim());
  const notLinux = os !== null && os !== "linux";

  function openVmDialog() {
    setVmDialog("loading");
    radmin.listVms((list) => {
      setVmDialog((prev) => (prev === "loading" ? list : prev));
    });
  }

  return (
    <>
      <BackHeading title="Bridge" onBack={() => router.push("/settings")} />

      <div className="max-w-[680px]">
        {notLinux ? (
          <Callout variant="warning" label="// LINUX ONLY">
            This bridge setup is for running R6S in a Windows VM on Linux. On
            Windows, install RadminVPN directly — no bridge needed.
          </Callout>
        ) : (
          <>
            {radmin.competingRoute && (
              <Callout variant="warning" label="// CONFLICT" className="mb-4">
                Interface <strong>{radmin.competingRoute}</strong> already
                routes 26.x — remove it before creating the bridge.
              </Callout>
            )}

            <div className="flex w-fit flex-col gap-4">
              <div className="flex flex-wrap items-stretch gap-4">
                <StatusChip
                  label="VirtualBox"
                  value={radmin.vboxInstalled ? "installed" : "not found"}
                  ok={radmin.vboxInstalled}
                />
                <StatusChip
                  label="Bridge"
                  value={
                    radmin.bridgeReady
                      ? "ready"
                      : radmin.bridgePresent
                        ? "not configured"
                        : "not set up"
                  }
                  ok={radmin.bridgeReady}
                />
                <Callout variant="notice" label="// NOTE" compact className="">
                  See the <Link href="/faq/multiplayer">setup guide</Link> in
                  the FAQ.
                </Callout>
              </div>

              <div className="rounded-lg border border-border bg-surface px-5 py-4">
                <span className="mb-3 block font-display text-[1.05rem] font-bold text-text">
                  RadminVPN
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={ip}
                    onChange={(event) => setIpEdit(event.target.value)}
                    placeholder="26.x.x.x"
                    disabled={busy}
                    className={`min-w-[10rem] flex-1 ${inputClasses} font-mono disabled:opacity-50`}
                  />
                  <Button
                    variant="primary"
                    disabled={busy || !ipValid || !radmin.vboxInstalled}
                    onClick={() => radmin.createBridge(ip.trim())}
                  >
                    {radmin.bridgePresent ? "Reconfigure" : "Create bridge"}
                  </Button>
                  {radmin.bridgePresent && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => radmin.removeBridge()}
                    >
                      Remove
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    disabled={busy || !radmin.bridgePresent}
                    onClick={openVmDialog}
                  >
                    Attach VM
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {vmDialog !== null && (
        <Dialog
          title="Attach VM"
          onClose={() => setVmDialog(null)}
          footer={
            <Button variant="secondary" onClick={() => setVmDialog(null)}>
              Cancel
            </Button>
          }
        >
          {vmDialog === "loading" ? (
            <p className="font-mono text-ui text-text-muted">Loading VMs…</p>
          ) : vmDialog.length === 0 ? (
            <p className="font-mono text-ui text-text-muted">
              No VirtualBox VMs found.
            </p>
          ) : (
            <>
              <p className="mb-4 text-body text-text-muted">
                Pick the VM to attach to the bridge:
              </p>
              <div className="flex flex-col gap-2">
                {vmDialog.map((vm) => (
                  <button
                    key={vm}
                    onClick={() => {
                      radmin.attach(vm);
                      setVmDialog(null);
                    }}
                    className="rounded-md border border-border bg-surface-2 px-3 py-2 text-left text-body text-text transition hover:border-border-brand hover:bg-border"
                  >
                    {vm}
                  </button>
                ))}
              </div>
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
