"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { DiscordIcon } from "@/components/DiscordIcon";
import { OnLinux } from "@/components/OnLinux";
import { Row, TextSetting } from "@/components/SettingsControls";
import { Slider } from "@/components/Slider";
import { Tag } from "@/components/Tag";
import { TrashIcon } from "@/components/TrashIcon";
import {
  onBridgeReady,
  useDiskUsage,
  useLibraries,
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
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  );
}

function BridgeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="5" cy="12" r="2.4" />
      <circle cx="19" cy="12" r="2.4" />
      <path d="M7.4 12h9.2" />
    </svg>
  );
}

function SubscreenTile({
  href,
  title,
  icon,
}: {
  href: string;
  title: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="card-glow-hover card-line-hover relative flex items-center gap-2.5 overflow-hidden rounded-lg border border-border bg-surface px-4 py-2.5 no-underline transition-[border-color,background-color,box-shadow] duration-200 hover:border-border-brand hover:bg-surface-2"
    >
      {icon}
      <span className="font-display text-[1.05rem] font-bold text-text">
        {title}
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
  const [initialConfirm] = useState(confirm);

  return (
    <Row label={label}>
      <div className="relative">
        <TextSetting
          value={value}
          className="w-[230px] pr-8"
          onCommit={(draft) => {
            if (draft.trim() !== value) onSave(draft.trim());
          }}
        />
        {confirm > initialConfirm && (
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
  const diskUsageGb = useDiskUsage();
  const [libraries] = useLibraries();
  const [removeTarget, setRemoveTarget] = useState<LibraryEntry | null>(null);
  const [usernameSaved, setUsernameSaved] = useState(0);
  const [usernameRevert, setUsernameRevert] = useState(0);

  useEffect(() => {
    if (!settings) return;
    const onUsernameSaved = () => setUsernameSaved((tick) => tick + 1);
    const onInvalid = (field: string) => {
      if (field === "username") setUsernameRevert((tick) => tick + 1);
    };
    const onLoggedOut = (ok: boolean, message: string) =>
      showToast(ok ? "success" : "error", message);
    const onCacheCleared = () => showToast("success", "Cache cleared");
    settings.username_changed.connect(onUsernameSaved);
    settings.invalid_setting.connect(onInvalid);
    settings.logged_out.connect(onLoggedOut);
    settings.cache_cleared.connect(onCacheCleared);
    return () => {
      settings.username_changed.disconnect(onUsernameSaved);
      settings.invalid_setting.disconnect(onInvalid);
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
        <div className="grid max-w-[1160px] grid-cols-2 gap-8 max-[75em]:grid-cols-1">
          <section>
            <SectionHeading>Account</SectionHeading>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                <SaveField
                  key={`username:${usernameRevert}`}
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
                      className={`truncate font-mono text-body ${
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
              <div className="flex flex-wrap gap-3">
                <SubscreenTile
                  href="/settings/rpc"
                  title="Discord RPC"
                  icon={
                    <DiscordIcon className="h-[1.25rem] w-[1.25rem] shrink-0 text-text" />
                  }
                />
                <OnLinux>
                  <SubscreenTile
                    href="/settings/radmin"
                    title="Bridge"
                    icon={
                      <BridgeIcon className="h-[1.25rem] w-[1.25rem] shrink-0 text-text" />
                    }
                  />
                </OnLinux>
              </div>
            </div>
          </section>

          <section>
            <SectionHeading>Downloads</SectionHeading>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                <Row label="Disk usage">
                  <span className="font-mono text-body text-text">
                    {diskUsageGb != null ? `${diskUsageGb} GB` : "…"}
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
                          aria-label="Open"
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
                          <button
                            aria-label="Make default"
                            disabled={!library.exists}
                            onClick={() =>
                              settings.set_default_library(library.path)
                            }
                            className="p-1 text-text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <StarIcon />
                          </button>
                        )}
                        {!library.default && !library.fixed && (
                          <button
                            aria-label="Remove"
                            onClick={() =>
                              library.seasons > 0
                                ? setRemoveTarget(library)
                                : settings.remove_library(library.path)
                            }
                            className="p-1 text-text-muted transition-colors hover:text-[#e0405a]"
                          >
                            <TrashIcon />
                          </button>
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
                <Row
                  label="Download cache"
                  hint="Tools and mod files the Launcher reuses between downloads."
                >
                  <Button
                    variant="secondary"
                    onClick={() => settings.clear_cache()}
                  >
                    Clear
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
            {`This library contains ${removeTarget.seasons} ${
              removeTarget.seasons === 1 ? "season" : "seasons"
            } that will no longer appear in the Launcher. `}
            No files will be deleted.
          </p>
        </ConfirmModal>
      )}
    </>
  );
}
