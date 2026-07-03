"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Row, TextSetting } from "@/components/SettingsControls";
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

function DiscordIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-[1.25rem] w-[1.25rem] shrink-0 text-text-muted transition-colors group-hover:text-text"
      aria-hidden="true"
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.198.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

function BridgeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1.1rem] w-[1.1rem] shrink-0 text-text-muted transition-colors group-hover:text-text"
      aria-hidden="true"
    >
      <rect width="20" height="8" x="2" y="2" rx="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <path d="M6 6h.01" />
      <path d="M6 18h.01" />
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
      className="card-glow-hover card-line-hover group relative flex items-center gap-2.5 overflow-hidden rounded-lg border border-border bg-surface px-4 py-2.5 no-underline transition-[border-color,background-color,box-shadow] duration-200 hover:border-border-brand hover:bg-surface-2"
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
  const info = useInfo();
  const os = usePlatform();
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
        <div className="grid max-w-[1160px] grid-cols-2 gap-8 max-[64em]:grid-cols-1">
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
              <div className="flex flex-wrap gap-3">
                <SubscreenTile
                  href="/settings/rpc"
                  title="Discord RPC"
                  icon={<DiscordIcon />}
                />
                {os === "linux" && (
                  <SubscreenTile
                    href="/settings/bridge"
                    title="Bridge"
                    icon={<BridgeIcon />}
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
