"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BackHeading } from "@/components/BackHeading";
import { Callout } from "@/components/Callout";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { useRadmin, usePlatform } from "@/lib/bridge";

const IP_PATTERN = /^26\.\d+\.\d+\.\d+$/;

const inputClass =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-[0.55rem] font-mono text-body text-text outline-none placeholder:text-text-muted focus:border-brand disabled:opacity-50";

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
    <span className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-label">
      <span className="uppercase tracking-[0.12em] text-text-muted">
        {label}
      </span>
      <span className="flex items-center gap-1.5 text-text">
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
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const radmin = useRadmin({
    onResult: (ok, text) => setMessage({ ok, text }),
  });

  const [ipEdit, setIpEdit] = useState<string | null>(null);
  const [vms, setVms] = useState<string[] | null>(null);
  const [selectedVm, setSelectedVm] = useState("");
  const [vmPicker, setVmPicker] = useState(false);
  const autoListed = useRef(false);

  const ip = ipEdit ?? radmin.radminIp;
  const busy = radmin.busy;
  const ipValid = IP_PATTERN.test(ip.trim());
  const notLinux = os !== null && os !== "linux";

  const refreshVms = useCallback(() => {
    radmin.listVms((list) => {
      setVms(list);
      setSelectedVm((prev) =>
        prev && list.includes(prev) ? prev : (list[0] ?? ""),
      );
    });
  }, [radmin]);

  useEffect(() => {
    if (!radmin.ready || autoListed.current) return;
    autoListed.current = true;
    refreshVms();
  }, [radmin.ready, refreshVms]);

  return (
    <>
      <BackHeading title="RadminVPN" />

      <div className="max-w-[680px]">
        {notLinux ? (
          <Callout variant="warning" label="// LINUX ONLY">
            This bridge setup is for running R6S in a Windows VM on Linux. On
            Windows, install RadminVPN directly — no bridge needed.
          </Callout>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
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
            </div>

            {radmin.competingRoute && (
              <Callout variant="warning" label="// CONFLICT" className="mb-4">
                Interface <strong>{radmin.competingRoute}</strong> already routes
                26.x — remove it before creating the bridge.
              </Callout>
            )}

            <div className="grid grid-cols-2 gap-4 max-[52em]:grid-cols-1">
              <div className="rounded-lg border border-border bg-surface p-5">
                <div className="mb-3 font-mono text-label uppercase tracking-[0.12em] text-text-muted">
                  Bridge
                </div>
                <input
                  value={ip}
                  onChange={(event) => setIpEdit(event.target.value)}
                  placeholder="26.x.x.x"
                  disabled={busy}
                  className={inputClass}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    disabled={busy || !ipValid || !radmin.vboxInstalled}
                    onClick={() => {
                      setMessage(null);
                      radmin.createBridge(ip.trim());
                    }}
                  >
                    {radmin.bridgePresent ? "Reconfigure" : "Create bridge"}
                  </Button>
                  {radmin.bridgePresent && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        setMessage(null);
                        radmin.removeBridge();
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-label uppercase tracking-[0.12em] text-text-muted">
                    Virtual machine
                  </span>
                  <button
                    onClick={refreshVms}
                    disabled={busy}
                    className="font-mono text-label uppercase tracking-[0.1em] text-brand transition-colors hover:text-[#e0405a] disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>
                {vms === null ? (
                  <p className="font-mono text-ui text-text-muted">
                    Refresh to list your VMs.
                  </p>
                ) : vms.length === 0 ? (
                  <p className="font-mono text-ui text-text-muted">
                    No VirtualBox VMs found.
                  </p>
                ) : (
                  <>
                    <button
                      onClick={() => setVmPicker(true)}
                      disabled={busy}
                      className={`${inputClass} flex items-center justify-between text-left`}
                    >
                      <span className="truncate">
                        {selectedVm || "Select a VM"}
                      </span>
                      <span className="text-text-muted">▾</span>
                    </button>
                    <Button
                      variant="secondary"
                      className="mt-3 w-full"
                      disabled={busy || !selectedVm || !radmin.bridgePresent}
                      onClick={() => {
                        setMessage(null);
                        radmin.attach(selectedVm);
                      }}
                    >
                      Attach to bridge
                    </Button>
                  </>
                )}
              </div>
            </div>

            {message && !message.ok && (
              <Callout variant="warning" label="// ERROR" className="mt-4">
                {message.text}
              </Callout>
            )}

            <Callout variant="notice" label="// HOW IT WORKS" className="mt-4">
              <ol className="ml-4 list-decimal space-y-1">
                <li>
                  Create a Windows VM in VirtualBox and install RadminVPN on it
                </li>
                <li>Create the bridge with your RadminVPN IP</li>
                <li>Shut the VM down, then attach it</li>
                <li>In Windows, bridge the Ethernet 2 and Radmin VPN adapters</li>
              </ol>
            </Callout>
          </>
        )}
      </div>

      {vmPicker && vms && vms.length > 0 && (
        <Dialog
          title="Select a VM"
          footer={
            <Button variant="secondary" onClick={() => setVmPicker(false)}>
              Cancel
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            {vms.map((vm) => (
              <button
                key={vm}
                onClick={() => {
                  setSelectedVm(vm);
                  setVmPicker(false);
                }}
                className={`rounded-md border bg-surface-2 px-3 py-2 text-left text-body text-text transition hover:border-border-brand hover:bg-border ${
                  vm === selectedVm ? "border-border-brand" : "border-border"
                }`}
              >
                {vm}
              </button>
            ))}
          </div>
        </Dialog>
      )}
    </>
  );
}
