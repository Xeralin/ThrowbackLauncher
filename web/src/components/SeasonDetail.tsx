"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { AddToSteamButton } from "@/components/AddToSteam";
import { BackHeading } from "@/components/BackHeading";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { inputClasses } from "@/components/SettingsControls";
import { Dialog } from "@/components/Dialog";
import { LogBox, type LogLine } from "@/components/LogBox";
import { ShearsModal } from "@/components/ShearsModal";
import { Tabs, type TabItem } from "@/components/Tabs";
import { SplitTag, Tag } from "@/components/Tag";
import { UninstallModal } from "@/components/UninstallModal";
import {
  useDownloader,
  useLaunch,
  usePlatform,
  type LaunchStatus,
  type Season,
} from "@/lib/bridge";
import { operatorsLocked } from "@/lib/seasons";
import { showToast } from "@/lib/toast";

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

function PasswordInput({
  value,
  placeholder,
  autoFocus = false,
  onChange,
  onEnter,
}: {
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onEnter: () => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onEnter();
        }}
        className={`w-full ${inputClasses} py-[0.4rem] pr-10 text-body`}
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((value) => !value)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted transition-colors hover:text-text"
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
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          {!show && <line x1="4" y1="20" x2="20" y2="4" />}
        </svg>
      </button>
    </div>
  );
}

type TabId = "play" | "download" | "manage";

export function SeasonDetail({
  season,
  onBack,
}: {
  season: Season;
  onBack: () => void;
}) {
  const [log, setLog] = useState<LogLine[]>([]);
  const logId = useRef(0);
  const [loginKind, setLoginKind] = useState<string | null>(null);
  const [loginText, setLoginText] = useState("");
  const [loginAccount, setLoginAccount] = useState("");
  const [shearsOpen, setShearsOpen] = useState(false);
  const [uninstallOpen, setUninstallOpen] = useState(false);
  const [hmPrompt, setHmPrompt] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tab, setTab] = useState<TabId | null>(null);
  const [install, setInstall] = useState<LaunchStatus>({
    installed: false,
    hm: false,
    partial: false,
    steamLinked: false,
  });
  const deferredLog = useDeferredValue(log);
  const seededRef = useRef(false);
  const wasRunning = useRef(false);
  const os = usePlatform();
  const lc = useLaunch();

  const syncStatus = useCallback(() => {
    lc.status(season.key, (status) => {
      setInstall(status);
      setTab((prev) => {
        if (prev === null) return status.installed ? "play" : "download";
        if (!status.installed && prev !== "download") return "download";
        if (status.installed && prev === "download") return "play";
        return prev;
      });
    });
  }, [lc, season.key]);

  const dl = useDownloader({
    onLog: (line) =>
      setLog((prev) =>
        [...prev, { id: logId.current++, text: line }].slice(-500),
      ),
    onLogin: (kind) => setLoginKind(kind),
    onFinished: () => {
      setLoginKind(null);
      syncStatus();
    },
    onError: (message) => showToast("error", message),
    onSteamSetupDone: (ok) => {
      if (ok) syncStatus();
    },
    onPartialDeleted: (key) => {
      if (key === season.key) syncStatus();
    },
  });

  const active = dl.activeKey === season.key;
  const state = active ? dl.state : "idle";
  const running = active && dl.running;
  const progress = active ? dl.progress : 0;
  const busy = dl.running;

  useEffect(() => {
    if (wasRunning.current && !running) {
      if (state === "done") showToast("success", "Installed");
      if (state === "verified") showToast("success", "Game verified");
    }
    wasRunning.current = running;
  }, [running, state]);

  useEffect(() => {
    if (seededRef.current || !dl.ready) return;
    if (dl.activeKey === season.key) {
      seededRef.current = true;
      const login = dl.login;
      dl.loadHistory((history) => {
        setLog(
          history
            ? history.split("\n").map((text) => ({ id: logId.current++, text }))
            : [],
        );
        if (login) setLoginKind(login);
      });
    }
  }, [dl, season.key]);

  useEffect(() => {
    if (lc.ready) syncStatus();
  }, [lc.ready, syncStatus]);

  function startDownload(hm: boolean) {
    setHmPrompt(false);
    setLog([]);
    dl.start(season.key, hm);
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

  function cancelLogin() {
    dl.cancel();
    setLoginKind(null);
    setLoginText("");
    setLoginAccount("");
  }

  const statusLine =
    running && state !== "downloading" && deferredLog.length > 0
      ? deferredLog[deferredLog.length - 1].text
      : null;

  const tabs: TabItem<TabId>[] = [
    { id: "play", label: "Play", disabled: !install.installed },
    { id: "download", label: "Download", disabled: install.installed },
    { id: "manage", label: "Manage", disabled: !install.installed },
  ];

  return (
    <>
      <div className="flex h-[calc(100dvh_-_var(--topbar-h)_-_4rem)] flex-col min-[100em]:h-[calc(100dvh_-_var(--topbar-h)_-_5rem)]">
        <BackHeading title={`${season.code} ${season.name}`} onBack={onBack} />

        <div className="relative mb-6 h-[240px] shrink-0 overflow-hidden rounded-lg border border-border">
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
          <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/90 via-black/55 to-transparent" />

          <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
            {install.installed || install.partial ? (
              <SplitTag
                size="md"
                variant={install.installed ? "green" : "amber"}
                left={`${season.sizeGb} GB`}
                right={install.installed ? "Installed" : "Resume"}
              />
            ) : (
              <Tag size="md">{season.sizeGb} GB</Tag>
            )}
            {operatorsLocked(season.key) && (
              <Tag size="md" variant="red">
                Locked Operators
              </Tag>
            )}
            {season.liberator && (
              <Tag size="md" variant="liberator">
                Liberator
              </Tag>
            )}
            {(install.installed || install.partial
              ? install.hm
              : season.heatedMetal || season.hmBeta) && (
              <Tag size="md" variant="hm">
                Heated Metal
              </Tag>
            )}
          </div>
        </div>

        <Tabs tabs={tabs} active={tab} onSelect={setTab} />

        {!(tab === "download" && running) && (
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {tab === "play" && (
              <>
                {os === "windows" ? (
                  <Button
                    variant="primary"
                    disabled={busy}
                    onClick={() => lc.launch(season.key)}
                  >
                    Play
                  </Button>
                ) : install.steamLinked ? (
                  <>
                    <Button
                      variant="primary"
                      disabled={busy}
                      onClick={() => lc.launch(season.key)}
                    >
                      Play
                    </Button>
                    <AddToSteamButton season={season} again />
                  </>
                ) : (
                  <AddToSteamButton season={season} />
                )}
              </>
            )}
            {tab === "download" && !running && (
              <>
                <Button
                  variant="primary"
                  disabled={busy}
                  onClick={() => {
                    if (install.partial) startDownload(install.hm);
                    else if (season.heatedMetal) setHmPrompt(true);
                    else startDownload(false);
                  }}
                >
                  {install.partial ? "Continue download" : "Download"}
                </Button>
                {install.partial && (
                  <Button
                    variant="secondary"
                    destructive
                    disabled={busy}
                    onClick={() => setDeleteOpen(true)}
                  >
                    Delete
                  </Button>
                )}
              </>
            )}
            {tab === "manage" && (
              <>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => dl.verify(season.key, install.hm)}
                >
                  Verify
                </Button>
                {!install.hm && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setShearsOpen(true)}
                  >
                    Shears
                  </Button>
                )}
                <Button
                  variant="secondary"
                  destructive
                  disabled={busy}
                  onClick={() => setUninstallOpen(true)}
                >
                  Uninstall
                </Button>
              </>
            )}
          </div>
        )}

        {active && (running || state === "failed") && (
          <div className="mt-5 max-w-[640px]">
            {running && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <ProgressBar
                    value={progress}
                    indeterminate={state === "applying"}
                  />
                </div>
                {state === "downloading" && (
                  <span className="font-mono text-ui text-text-muted">
                    {Math.round(progress)}%
                  </span>
                )}
                {state === "downloading" && (
                  <Button variant="secondary" onClick={() => dl.cancel()}>
                    Pause
                  </Button>
                )}
              </div>
            )}
            {statusLine && (
              <p className="mt-3 font-mono text-label text-text-muted">
                {statusLine}
              </p>
            )}
            {state === "failed" && (
              <p className="font-mono text-ui text-brand">Failed</p>
            )}
          </div>
        )}

        {active &&
          state !== "idle" &&
          tab !== "play" &&
          deferredLog.length > 0 && (
            <div className="mt-4 flex min-h-24 max-w-[640px] flex-1 flex-col">
              <LogBox lines={deferredLog} follow className="flex-1" />
            </div>
          )}
      </div>

      {hmPrompt && (
        <Dialog title="Heated Metal" onClose={() => setHmPrompt(false)}>
          <p className="text-body text-text-muted">
            This season is also available with Heated Metal — a full SDK for R6S
            that adds extended capabilities to this build: an in-game map
            editor, extended scripting and an in-game console, unlock all
            cosmetics and attachments, custom keybinds and host networking
            controls.
          </p>
          {season.hmBeta && (
            <p className="mt-3 text-body text-text-muted">
              For this season Heated Metal is an open beta — the Launcher sets
              up HeliosLoader, and you copy the Heated Metal files from their
              Discord into the game folder yourself.
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => startDownload(false)}>
              Throwback
            </Button>
            <Button variant="primary" onClick={() => startDownload(true)}>
              Heated Metal
            </Button>
          </div>
        </Dialog>
      )}

      {loginKind && (
        <Dialog
          title={loginKind === "guard" ? "Steam Guard" : "Steam login"}
          onClose={cancelLogin}
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
              <Button variant="secondary" onClick={cancelLogin}>
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
              <p className="mb-4 text-body text-text-muted">
                Log in with your Steam account to start the download.
              </p>
              <input
                type="text"
                value={loginAccount}
                autoFocus
                placeholder="Account name"
                onChange={(event) => setLoginAccount(event.target.value)}
                className={`mb-2 w-full ${inputClasses} py-[0.4rem] text-body`}
              />
              <PasswordInput
                value={loginText}
                placeholder="Password"
                onChange={setLoginText}
                onEnter={submitLogin}
              />
            </>
          ) : (
            <>
              <p className="mb-4 text-body text-text-muted">
                {loginKind === "guard"
                  ? "Enter your Steam Guard code"
                  : "Enter your Steam password"}
              </p>
              {loginKind === "guard" ? (
                <input
                  type="text"
                  value={loginText}
                  autoFocus
                  onChange={(event) => setLoginText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitLogin();
                  }}
                  className={`w-full ${inputClasses} py-[0.4rem] text-body`}
                />
              ) : (
                <PasswordInput
                  value={loginText}
                  autoFocus
                  onChange={setLoginText}
                  onEnter={submitLogin}
                />
              )}
            </>
          )}
        </Dialog>
      )}

      {deleteOpen && (
        <ConfirmModal
          title="Delete download"
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            setDeleteOpen(false);
            dl.deletePartial(season.key);
          }}
          onCancel={() => setDeleteOpen(false)}
        >
          <p className="text-body text-text-muted">
            This deletes the partially downloaded files for {season.name}.
          </p>
        </ConfirmModal>
      )}

      {shearsOpen && (
        <ShearsModal season={season} onClose={() => setShearsOpen(false)} />
      )}

      {uninstallOpen && (
        <UninstallModal
          season={season}
          onClose={() => setUninstallOpen(false)}
          onDone={syncStatus}
        />
      )}
    </>
  );
}
