"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { inputClasses, Row } from "@/components/SettingsControls";
import { Slider } from "@/components/Slider";
import { Tag } from "@/components/Tag";
import { TrashIcon } from "@/components/TrashIcon";
import {
  onBridgeReady,
  useInfo,
  useLibraries,
  usePlatform,
  useSettings,
  type LibraryEntry,
} from "@/lib/bridge";
import { showToast } from "@/lib/toast";

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SubscreenCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="card-glow-hover card-line-hover relative flex flex-col gap-1 overflow-hidden rounded-lg border border-border bg-surface px-5 py-[0.85rem] no-underline transition-[border-color,background-color,box-shadow] duration-200 hover:border-border-brand hover:bg-surface-2"
    >
      <span className="font-display text-[1.05rem] font-bold text-text">
        {title}
      </span>
      <span className="text-[0.82rem] leading-[1.5] text-text-muted">
        {desc}
      </span>
    </Link>
  );
}

function SaveField({
  label,
  value,
  confirm,
  onSave,
}: {
  label: string;
  value: string;
  confirm: number;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setDraft(value);
  }
  const dirty = draft.trim() !== value;

  return (
    <Row label={label}>
      <div className="relative">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (dirty) onSave(draft.trim());
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className={`w-[230px] pr-8 ${inputClasses}`}
        />
        {confirm > 0 && (
          <span
            key={confirm}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-save-check h-4 w-4 text-success opacity-0"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>
    </Row>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 font-display text-[1.4rem] font-bold text-text">
      {children}
    </h2>
  );
}

export default function SettingsPage() {
  const settings = useSettings();
  const info = useInfo();
  const os = usePlatform();
  const [libraries] = useLibraries();
  const [removeTarget, setRemoveTarget] = useState<LibraryEntry | null>(null);
  const [usernameSaved, setUsernameSaved] = useState(0);

  useEffect(() => {
    if (!settings) return;
    const onUsernameSaved = () => setUsernameSaved((tick) => tick + 1);
    const onLoggedOut = (ok: boolean, message: string) =>
      showToast(ok ? "success" : "error", message);
    const onCacheCleared = () => showToast("success", "Cache cleared");
    settings.username_changed.connect(onUsernameSaved);
    settings.logged_out.connect(onLoggedOut);
    settings.cache_cleared.connect(onCacheCleared);
    return () => {
      settings.username_changed.disconnect(onUsernameSaved);
      settings.logged_out.disconnect(onLoggedOut);
      settings.cache_cleared.disconnect(onCacheCleared);
    };
  }, [settings]);

  return (
    <>
      <h1 className="mb-4 font-display text-[1.9rem] font-bold text-text">
        Settings
      </h1>

      {!settings ? (
        <p className="font-mono text-ui text-text-muted">Loading…</p>
      ) : (
        <div className="grid max-w-[1160px] grid-cols-2 gap-8 max-[64em]:grid-cols-1">
          <section>
            <SectionHeading>Account</SectionHeading>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                <SaveField
                  label="Username"
                  value={settings.username}
                  confirm={usernameSaved}
                  onSave={(value) => settings.set_username(value)}
                />
              </div>
              <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                <Row label="Steam session">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`truncate text-body ${
                        settings.steam_account ? "text-text" : "text-text-muted"
                      }`}
                    >
                      {settings.steam_account || "Not signed in"}
                    </span>
                    <Button
                      variant="secondary"
                      className="shrink-0"
                      disabled={!settings.steam_account}
                      onClick={() => settings.logout()}
                    >
                      Log out
                    </Button>
                  </div>
                </Row>
              </div>
              <div className="grid h-[118px] grid-cols-2 gap-4">
                <SubscreenCard
                  href="/settings/rpc"
                  title="Discord RPC"
                  desc="Show the running season as your Discord activity"
                />
                {os === "linux" && (
                  <SubscreenCard
                    href="/settings/bridge"
                    title="Bridge"
                    desc="Bridge a Windows VM into your network for RadminVPN"
                  />
                )}
              </div>
            </div>
          </section>

          <section>
            <SectionHeading>Downloads</SectionHeading>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                <Row label="Disk usage">
                  <span className="font-mono text-body text-text">
                    {info ? `${info.diskUsageGb} GB` : "—"}
                  </span>
                </Row>
                <Row label="Libraries">
                  <Button
                    variant="secondary"
                    onClick={() => settings.add_library()}
                  >
                    Add library
                  </Button>
                </Row>
                <div className="flex flex-col gap-2 pb-1">
                  {(libraries ?? []).map((library) => (
                    <div
                      key={library.path}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          title={library.path}
                          className="truncate font-mono text-label text-text"
                        >
                          {library.display}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {library.default && <Tag>Default</Tag>}
                          {!library.exists && (
                            <Tag variant="red">Not found</Tag>
                          )}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          title="Open"
                          disabled={!library.exists}
                          onClick={() =>
                            onBridgeReady((bridge) =>
                              bridge.info.open_library(library.path),
                            )
                          }
                          className="p-1 text-text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FolderIcon />
                        </button>
                        {!library.default && (
                          <>
                            <button
                              title="Make default"
                              disabled={!library.exists}
                              onClick={() =>
                                settings.set_default_library(library.path)
                              }
                              className="p-1 text-text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <StarIcon />
                            </button>
                            <button
                              title="Remove"
                              onClick={() =>
                                library.seasons > 0 || !library.exists
                                  ? setRemoveTarget(library)
                                  : settings.remove_library(library.path)
                              }
                              className="p-1 text-text-muted transition-colors hover:text-[#e0405a]"
                            >
                              <TrashIcon />
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                <Row
                  label="Parallel downloads"
                  hint="How many file chunks are downloaded at the same time. A higher value can be faster on a fast connection, but uses more bandwidth and system resources."
                >
                  <Slider
                    value={settings.max_downloads}
                    min={settings.download_bounds.min}
                    max={settings.download_bounds.max}
                    onCommit={(value) => settings.set_max_downloads(value)}
                  />
                </Row>
                <Row label="Download cache">
                  <Button
                    variant="secondary"
                    onClick={() => settings.clear_cache()}
                  >
                    Clear cache
                  </Button>
                </Row>
              </div>
            </div>
          </section>
        </div>
      )}

      {removeTarget && (
        <ConfirmModal
          title="Remove library"
          confirmLabel="Remove"
          destructive
          onConfirm={() => {
            settings?.remove_library(removeTarget.path);
            setRemoveTarget(null);
          }}
          onCancel={() => setRemoveTarget(null)}
        >
          <p className="text-body text-text-muted">
            {removeTarget.exists
              ? `This library contains ${removeTarget.seasons} ${
                  removeTarget.seasons === 1 ? "season" : "seasons"
                } that will no longer appear in the Launcher. `
              : "This library was not found. Seasons in it will no longer appear in the Launcher. "}
            No files will be deleted.
          </p>
        </ConfirmModal>
      )}
    </>
  );
}
