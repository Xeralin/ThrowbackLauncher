"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Dialog } from "@/components/Dialog";
import { ShearsModal } from "@/components/ShearsModal";
import { UninstallModal } from "@/components/UninstallModal";
import { Switch } from "@/components/Switch";
import {
  useDownloader,
  useLaunch,
  usePlatform,
  type ProtonOption,
  type Season,
} from "@/lib/bridge";

function ProgressBar({
  value,
  indeterminate,
}: {
  value: number;
  indeterminate: boolean;
}) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className={`h-full bg-brand ${indeterminate ? "w-full animate-pulse" : "transition-[width] duration-200"}`}
        style={indeterminate ? undefined : { width: `${value}%` }}
      />
    </div>
  );
}

export function SeasonDetail({
  season,
  onBack,
}: {
  season: Season;
  onBack: () => void;
}) {
  const [log, setLog] = useState<string[]>([]);
  const [loginKind, setLoginKind] = useState<string | null>(null);
  const [loginText, setLoginText] = useState("");
  const [loginAccount, setLoginAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [steamPanel, setSteamPanel] = useState<
    "running" | { protons: ProtonOption[] } | null
  >(null);
  const [steamMessage, setSteamMessage] = useState<string | null>(null);
  const [shearsOpen, setShearsOpen] = useState(false);
  const [uninstallOpen, setUninstallOpen] = useState(false);
  const [enableHm, setEnableHm] = useState(false);
  const [install, setInstall] = useState<{
    installed: boolean;
    hm: boolean;
    partial: boolean;
  }>({
    installed: false,
    hm: false,
    partial: false,
  });
  const deferredLog = useDeferredValue(log);
  const seededRef = useRef(false);
  const os = usePlatform();
  const lc = useLaunch();

  function refreshInstalled() {
    lc.status(season.key, setInstall);
  }

  const dl = useDownloader({
    onLog: (line) => setLog((prev) => [...prev, line].slice(-500)),
    onLogin: (kind) => setLoginKind(kind),
    onFinished: () => {
      setLoginKind(null);
      refreshInstalled();
    },
    onError: (message) => setError(message),
    onSteamSetupDone: (_ok, message) => {
      setSteamPanel(null);
      setSteamMessage(message);
    },
  });

  const active = dl.activeKey === season.key;
  const state = active ? dl.state : "idle";
  const running = active && dl.running;
  const progress = active ? dl.progress : 0;
  const busyElsewhere = dl.running && !active;

  useEffect(() => {
    if (seededRef.current || !dl.ready) return;
    if (dl.activeKey === season.key) {
      seededRef.current = true;
      dl.loadHistory((history) => setLog(history ? history.split("\n") : []));
    }
  }, [dl, season.key]);

  useEffect(() => {
    if (lc.ready) lc.status(season.key, setInstall);
  }, [lc, season.key]);

  function startDownload() {
    setError(null);
    setLog([]);
    dl.start(season.key, enableHm);
  }

  function submitLogin() {
    if (loginKind === "account") {
      if (!loginAccount.trim() || !loginText.length) return;
      dl.submitAccountLogin(loginAccount.trim(), loginText);
    } else {
      if (!loginText.length) return;
      dl.submitLogin(loginText);
    }
    setLoginText("");
    setLoginAccount("");
    setLoginKind(null);
  }

  function openSteam() {
    setSteamMessage(null);
    dl.isSteamRunning((running) => {
      if (running) {
        setSteamPanel("running");
      } else {
        dl.protonOptions((protons) => setSteamPanel({ protons }));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="-ml-8 -mt-8 mb-6 flex h-[29px] w-[44px] items-center justify-center border-b border-r border-border bg-surface text-text transition-colors hover:bg-surface-2 max-[48em]:-ml-5 max-[48em]:-mt-5 min-[100em]:-ml-12 min-[100em]:-mt-10"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <div className="relative mb-6 h-[240px] overflow-hidden rounded-lg border border-border">
        {season.splash ? (
          <Image
            src={season.splash}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0d12] to-[#0d0d0f]" />
        )}

        <div className="absolute bottom-5 left-6 [text-shadow:0_2px_6px_rgba(0,0,0,0.85)]">
          <div className="font-mono text-label tracking-[0.12em] text-brand">
            {season.code}
          </div>
          <div className="font-display text-[2.2rem] font-bold leading-none text-text">
            {season.name}
          </div>
          <div className="mt-1 text-ui text-text-muted">
            {season.sizeGb} GB
          </div>
          {install.installed && (
            <span className="mt-2 inline-block rounded-[3px] border border-[#1a3a1a] bg-[#0a1a0a] px-[0.4rem] py-[0.1rem] font-mono text-label text-success">
              Installed
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {running ? (
          <Button variant="secondary" onClick={() => dl.cancel()}>
            Cancel
          </Button>
        ) : (
          <>
            {os === "windows" && install.installed && (
              <Button
                variant="primary"
                disabled={busyElsewhere}
                onClick={() => lc.launch(season.key)}
              >
                Start
              </Button>
            )}
            {os === "linux" && install.installed && (
              <Button variant="primary" disabled={busyElsewhere} onClick={openSteam}>
                Add to Steam
              </Button>
            )}
            <Button
              variant={install.installed ? "secondary" : "primary"}
              disabled={busyElsewhere || install.installed}
              onClick={startDownload}
            >
              {install.partial && !install.installed
                ? "Continue download"
                : "Download"}
            </Button>
            {install.installed && (
              <Button
                variant="secondary"
                disabled={busyElsewhere}
                onClick={() => dl.verify(season.key, install.hm)}
              >
                Verify
              </Button>
            )}
            {install.installed && !install.hm && (
              <Button
                variant="secondary"
                disabled={busyElsewhere}
                onClick={() => setShearsOpen(true)}
              >
                Shears
              </Button>
            )}
            {install.installed && (
              <Button
                variant="secondary"
                destructive
                disabled={busyElsewhere}
                onClick={() => setUninstallOpen(true)}
              >
                Uninstall
              </Button>
            )}
            {season.heatedMetal && (
              <Switch
                checked={enableHm}
                onChange={setEnableHm}
                label="Heated Metal"
              />
            )}
          </>
        )}
        {running && state === "downloading" && (
          <span className="font-mono text-ui text-text-muted">
            {Math.round(progress)}%
          </span>
        )}
        {active && state === "done" && (
          <span className="font-mono text-ui text-success">Installed</span>
        )}
        {active && state === "failed" && (
          <span className="font-mono text-ui text-brand">Failed</span>
        )}
      </div>

      {steamMessage && (
        <p className="mt-3 font-mono text-ui text-text-muted">
          {steamMessage}
        </p>
      )}

      {running && (
        <div className="mt-4 max-w-[640px]">
          <ProgressBar value={progress} indeterminate={state === "applying"} />
        </div>
      )}

      {error && (
        <p className="mt-3 font-mono text-ui text-brand">{error}</p>
      )}

      {active && state !== "idle" && deferredLog.length > 0 && (
        <p className="mt-3 font-mono text-label text-text-muted">
          {deferredLog[deferredLog.length - 1]}
        </p>
      )}

      {loginKind && (
        <Dialog
          title={loginKind === "guard" ? "Steam Guard" : "Steam login"}
          footer={
            <>
              {loginKind === "account" && (
                <Link
                  href="/faq/getting-started#why-does-the-launcher-need-my-steam-login"
                  className="mr-auto self-center text-ui text-text-muted underline underline-offset-2 transition-colors hover:text-text"
                >
                  Why does the Launcher need my Steam login?
                </Link>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  dl.cancel();
                  setLoginKind(null);
                  setLoginText("");
                  setLoginAccount("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={
                  loginKind === "account"
                    ? !loginAccount.trim() || !loginText.length
                    : !loginText.length
                }
                onClick={submitLogin}
              >
                Login
              </Button>
            </>
          }
        >
          {loginKind === "account" ? (
            <>
              <p className="-mt-2 mb-4 text-body text-text-muted">
                Log in with your Steam account to start the download.
              </p>
              <input
                type="text"
                value={loginAccount}
                autoFocus
                placeholder="Account name"
                onChange={(event) => setLoginAccount(event.target.value)}
                className="mb-2 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-body text-text outline-none focus:border-brand"
              />
              <input
                type="password"
                value={loginText}
                placeholder="Password"
                onChange={(event) => setLoginText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitLogin();
                }}
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-body text-text outline-none focus:border-brand"
              />
            </>
          ) : (
            <>
              <p className="-mt-2 mb-4 text-body text-text-muted">
                {loginKind === "guard"
                  ? "Enter your Steam Guard code"
                  : "Enter your Steam password"}
              </p>
              <input
                type={loginKind === "guard" ? "text" : "password"}
                value={loginText}
                autoFocus
                onChange={(event) => setLoginText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitLogin();
                }}
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-body text-text outline-none focus:border-brand"
              />
            </>
          )}
        </Dialog>
      )}

      {steamPanel === "running" && (
        <ConfirmModal
          title="Add to Steam"
          confirmLabel="Retry"
          onConfirm={openSteam}
          onCancel={() => setSteamPanel(null)}
        >
          <p className="-mt-2 text-body text-text-muted">
            Close Steam completely to apply, then retry.
          </p>
        </ConfirmModal>
      )}

      {steamPanel && steamPanel !== "running" && (
        <Dialog
          title="Add to Steam"
          footer={
            <Button variant="secondary" onClick={() => setSteamPanel(null)}>
              Cancel
            </Button>
          }
        >
          <p className="-mt-2 mb-3 text-body text-text-muted">
            Pick a Proton version:
          </p>
          {steamPanel.protons.length === 0 ? (
            <p className="font-mono text-ui text-text-muted">No Proton found.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {steamPanel.protons.map((proton) => (
                <button
                  key={proton.index}
                  onClick={() => {
                    dl.steamSetup(season.key, proton.index);
                    setSteamPanel(null);
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

      {shearsOpen && (
        <ShearsModal season={season} onClose={() => setShearsOpen(false)} />
      )}

      {uninstallOpen && (
        <UninstallModal
          season={season}
          onClose={() => setUninstallOpen(false)}
          onDone={refreshInstalled}
        />
      )}
    </>
  );
}
