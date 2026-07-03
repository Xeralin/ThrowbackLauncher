"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
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
  useLibraries,
  usePlatform,
  useSettings,
  type LaunchStatus,
  type LibraryEntry,
  type Season,
} from "@/lib/bridge";
import { operatorsLocked } from "@/lib/seasons";
import { showToast } from "@/lib/toast";

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
        className={`w-full ${inputClasses} pr-10`}
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

function LibraryPicker({
  libraries,
  selected,
  onSelect,
  onAdd,
  addDisabled = false,
}: {
  libraries: LibraryEntry[];
  selected: string;
  onSelect: (path: string) => void;
  onAdd: () => void;
  addDisabled?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-label uppercase tracking-[0.12em] text-text-muted">
        Install to
      </p>
      <div className="flex flex-col gap-2">
        {libraries.map((library) => (
          <button
            key={library.path}
            disabled={!library.exists}
            onClick={() => onSelect(library.path)}
            className={`flex items-center justify-between gap-3 rounded-md border bg-surface-2 px-3 py-2 text-left transition ${
              library.path === selected
                ? "border-border-brand"
                : "border-border"
            } ${
              library.exists
                ? "hover:border-border-brand"
                : "cursor-not-allowed opacity-50"
            }`}
          >
            <span
              title={library.path}
              className="min-w-0 truncate font-mono text-label text-text"
            >
              {library.display}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {library.default && <Tag>Default</Tag>}
              {library.exists ? (
                library.freeGb !== null && (
                  <span className="font-mono text-[0.6rem] text-text-muted">
                    {library.freeGb} GB free
                  </span>
                )
              ) : (
                <Tag variant="red">Not found</Tag>
              )}
            </span>
          </button>
        ))}
        <Button
          variant="secondary"
          className="self-start"
          disabled={addDisabled}
          onClick={onAdd}
        >
          Add folder…
        </Button>
      </div>
    </div>
  );
}

type TabId = "play" | "manage";

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
  const [dlPrompt, setDlPrompt] = useState(false);
  const [dlLibrary, setDlLibrary] = useState("");
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
  const settings = useSettings();
  const [libraryEntries, refreshLibraries] = useLibraries();
  const libs = useMemo(() => libraryEntries ?? [], [libraryEntries]);
  const multiLib = libs.length > 1;

  const syncStatus = useCallback(() => {
    lc.status(season.key, (status) => {
      setInstall(status);
      setTab((prev) =>
        prev === null || (!status.installed && prev === "manage")
          ? "play"
          : prev,
      );
    });
  }, [lc, season.key]);

  const dl = useDownloader({
    onLog: (line) => {
      if (dl.activeKey !== season.key) return;
      setLog((prev) =>
        [...prev, { id: logId.current++, text: line }].slice(-500),
      );
    },
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
  const busy = dl.running;
  const queued = dl.queue.includes(season.key);

  useEffect(() => {
    if (wasRunning.current && !running) {
      if (state === "done") showToast("success", "Installed");
      if (state === "verified") showToast("success", "Game verified");
      if (state === "failed") showToast("error", "Download failed");
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

  useEffect(() => {
    if (!settings) return;
    const onLibraries = () => syncStatus();
    settings.libraries_changed.connect(onLibraries);
    return () => settings.libraries_changed.disconnect(onLibraries);
  }, [settings, syncStatus]);

  const prevLibPaths = useRef<string[] | null>(null);
  useEffect(() => {
    const paths = libs.map((library) => library.path);
    const prev = prevLibPaths.current;
    prevLibPaths.current = paths;
    if (!dlPrompt || !prev) return;
    const added = paths.find((path) => !prev.includes(path));
    if (added) setDlLibrary(added);
  }, [libs, dlPrompt]);

  function startDownload(hm: boolean, library = "") {
    setDlPrompt(false);
    if (busy) {
      dl.enqueue(season.key, hm, library);
      return;
    }
    setLog([]);
    dl.start(season.key, hm, library);
  }

  function openDownloadPrompt() {
    refreshLibraries();
    const preferred =
      libs.find((library) => library.default && library.exists) ??
      libs.find((library) => library.exists);
    setDlLibrary(preferred?.path ?? "");
    setDlPrompt(true);
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

  const statusRow = (
    <div className="mt-4 flex items-center gap-4">
      {state === "downloading" && (
        <Button variant="secondary" onClick={() => dl.cancel()}>
          {install.installed ? "Cancel" : "Pause"}
        </Button>
      )}
      {statusLine && (
        <p className="min-w-0 truncate font-mono text-label text-text-muted">
          {statusLine}
        </p>
      )}
    </div>
  );

  const tabs: TabItem<TabId>[] = [
    { id: "play", label: "Play" },
    { id: "manage", label: "Manage", disabled: !install.installed },
  ];

  return (
    <>
      <div className="flex h-[calc(100dvh_-_var(--topbar-h)_-_3rem)] flex-col min-[100em]:h-[calc(100dvh_-_var(--topbar-h)_-_5rem)]">
        <BackHeading title={`${season.code} ${season.name}`} onBack={onBack} />

        <div className="relative mb-4 h-[220px] shrink-0 overflow-hidden rounded-lg border border-border">
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
            {install.installed || install.partial || running || queued ? (
              <SplitTag
                size="md"
                variant={
                  install.installed ? "green" : running ? "purple" : "amber"
                }
                left={`${season.sizeGb} GB`}
                right={
                  install.installed
                    ? "Installed"
                    : running
                      ? "Downloading"
                      : queued
                        ? "Queued"
                        : "Paused"
                }
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

        {!running && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {tab === "play" &&
              (install.installed ? (
                os === "windows" ? (
                  <Button
                    variant="primary"
                    onClick={() => lc.launch(season.key)}
                  >
                    Play
                  </Button>
                ) : install.steamLinked ? (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => lc.launch(season.key)}
                    >
                      Play
                    </Button>
                    <AddToSteamButton season={season} again />
                  </>
                ) : (
                  <AddToSteamButton season={season} />
                )
              ) : (
                <>
                  {queued ? (
                    <Button
                      variant="secondary"
                      onClick={() => dl.dequeue(season.key)}
                    >
                      Remove from queue
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (install.partial) startDownload(install.hm);
                        else if (season.heatedMetal || multiLib)
                          openDownloadPrompt();
                        else startDownload(false);
                      }}
                    >
                      {busy
                        ? "Queue download"
                        : install.partial
                          ? "Continue download"
                          : "Download"}
                    </Button>
                  )}
                  {install.partial && (
                    <Button
                      variant="secondary"
                      destructive
                      onClick={() => setDeleteOpen(true)}
                    >
                      Delete
                    </Button>
                  )}
                </>
              ))}
            {tab === "manage" && (
              <>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => dl.verify(season.key)}
                >
                  Verify
                </Button>
                {!install.hm && (
                  <Button
                    variant="secondary"
                    onClick={() => setShearsOpen(true)}
                  >
                    Shears
                  </Button>
                )}
                <Button
                  variant="secondary"
                  destructive
                  onClick={() => setUninstallOpen(true)}
                >
                  Uninstall
                </Button>
              </>
            )}
          </div>
        )}

        {running && statusRow}

        <div className="mt-3 flex min-h-24 flex-1 flex-col">
          <LogBox lines={deferredLog} follow className="flex-1" />
        </div>
      </div>

      {dlPrompt && (
        <Dialog
          title={season.heatedMetal ? "Heated Metal" : "Download"}
          onClose={() => setDlPrompt(false)}
          footer={
            season.heatedMetal ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => startDownload(false, dlLibrary)}
                >
                  Throwback
                </Button>
                <Button
                  variant="primary"
                  onClick={() => startDownload(true, dlLibrary)}
                >
                  Heated Metal
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setDlPrompt(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => startDownload(false, dlLibrary)}
                >
                  {busy ? "Queue download" : "Download"}
                </Button>
              </>
            )
          }
        >
          {multiLib && (
            <LibraryPicker
              libraries={libs}
              selected={dlLibrary}
              onSelect={setDlLibrary}
              onAdd={() => settings?.add_library()}
              addDisabled={busy}
            />
          )}
          {season.heatedMetal && (
            <>
              <p
                className={`${multiLib ? "mt-4 " : ""}text-body text-text-muted`}
              >
                This season is also available with Heated Metal — a full SDK for
                R6S that adds extended capabilities to this build: an in-game
                map editor, extended scripting and an in-game console, unlock
                all cosmetics and attachments, custom keybinds and host
                networking controls.
              </p>
              {season.hmBeta && (
                <p className="mt-3 text-body text-text-muted">
                  For this season Heated Metal is an open beta — the Launcher
                  sets up HeliosLoader, and you copy the Heated Metal files from
                  their Discord into the game folder yourself.
                </p>
              )}
            </>
          )}
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
                className={`mb-2 w-full ${inputClasses}`}
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
                  className={`w-full ${inputClasses}`}
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
