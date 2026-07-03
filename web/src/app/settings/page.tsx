"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { ConfirmModal } from "@/components/ConfirmModal";
import { inputClasses, Row, TextSetting } from "@/components/SettingsControls";
import { Slider } from "@/components/Slider";
import { Switch } from "@/components/Switch";
import { Tag } from "@/components/Tag";
import {
  onBridgeReady,
  useInfo,
  useLibraries,
  useSettings,
  type LibraryEntry,
} from "@/lib/bridge";
import { showToast } from "@/lib/toast";

function SaveField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setDraft(value);
  }
  const dirty = draft.trim() !== value;

  function save() {
    if (dirty) onSave(draft.trim());
  }

  return (
    <Row label={label}>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
          className={`w-[230px] ${inputClasses}`}
        />
        <Button variant="secondary" disabled={!dirty} onClick={save}>
          Save
        </Button>
      </div>
    </Row>
  );
}

function FieldCol({
  label,
  children,
  span,
}: {
  label: string;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <label
      className={`flex min-w-0 flex-col gap-1 ${span ? "col-span-2" : ""}`}
    >
      <span className="font-mono text-label uppercase tracking-[0.12em] text-text-muted">
        {label}
      </span>
      {children}
    </label>
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
  const [libraries] = useLibraries();
  const [reverts, setReverts] = useState<Record<string, number>>({});
  const [removeTarget, setRemoveTarget] = useState<LibraryEntry | null>(null);

  useEffect(() => {
    if (!settings) return;
    const onUsernameSaved = () => showToast("success", "Username updated");
    const onLoggedOut = (ok: boolean, message: string) =>
      showToast(ok ? "success" : "error", message);
    const onCacheCleared = () => showToast("success", "Cache cleared");
    const onInvalid = (field: string) =>
      setReverts((prev) => ({ ...prev, [field]: (prev[field] ?? 0) + 1 }));
    settings.username_changed.connect(onUsernameSaved);
    settings.logged_out.connect(onLoggedOut);
    settings.cache_cleared.connect(onCacheCleared);
    settings.invalid_setting.connect(onInvalid);
    return () => {
      settings.username_changed.disconnect(onUsernameSaved);
      settings.logged_out.disconnect(onLoggedOut);
      settings.cache_cleared.disconnect(onCacheCleared);
      settings.invalid_setting.disconnect(onInvalid);
    };
  }, [settings]);

  const rpc = settings?.rpc_config ?? {};
  const field = (key: string, placeholder?: string) => (
    <TextSetting
      key={`${key}:${reverts[key] ?? 0}`}
      className="w-full"
      value={rpc[key] ?? ""}
      placeholder={placeholder}
      onCommit={(value) => settings?.set_rpc_field(key, value)}
    />
  );

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
                  onSave={(value) => settings.set_username(value)}
                />
              </div>
              <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                <Row label="Steam session">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-body ${
                        settings.steam_account ? "text-text" : "text-text-muted"
                      }`}
                    >
                      {settings.steam_account || "Not signed in"}
                    </span>
                    <Button
                      variant="secondary"
                      disabled={!settings.steam_account}
                      onClick={() => settings.logout()}
                    >
                      Log out
                    </Button>
                  </div>
                </Row>
              </div>
              <div className="flex flex-wrap items-stretch gap-4">
                <div className="flex w-fit items-center gap-6 rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                  <span className="font-display text-[1.05rem] font-bold text-text">
                    Discord presence
                  </span>
                  <Switch
                    checked={settings.discord_rpc}
                    onChange={(value) => settings.set_discord_rpc(value)}
                  />
                </div>
                {settings.discord_rpc && (
                  <Callout label="// NOTE" compact className="">
                    See the{" "}
                    <Link href="/faq/getting-started#how-do-i-set-up-the-discord-presence">
                      setup guide
                    </Link>{" "}
                    in the FAQ.
                  </Callout>
                )}
              </div>
              {settings.discord_rpc && (
                <div className="rounded-lg border border-border bg-surface px-5 py-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <FieldCol label="Application ID" span>
                      {field(
                        "discord_client_id",
                        "required — your Discord app ID",
                      )}
                    </FieldCol>
                    <FieldCol label="Title">
                      {field("discord_details")}
                    </FieldCol>
                    <FieldCol label="State">
                      {field("discord_state", "optional")}
                    </FieldCol>
                    <FieldCol label="Large image">
                      {field("discord_large_image", "asset key")}
                    </FieldCol>
                    <FieldCol label="Large image text">
                      {field("discord_large_text")}
                    </FieldCol>
                    <FieldCol label="Small image">
                      {field("discord_small_image", "asset key")}
                    </FieldCol>
                    <FieldCol label="Small image text">
                      {field("discord_small_text")}
                    </FieldCol>
                    <FieldCol label="Button 1 label">
                      {field("discord_button1_label")}
                    </FieldCol>
                    <FieldCol label="Button 1 URL">
                      {field("discord_button1_url")}
                    </FieldCol>
                    <FieldCol label="Button 2 label">
                      {field("discord_button2_label")}
                    </FieldCol>
                    <FieldCol label="Button 2 URL">
                      {field("discord_button2_url")}
                    </FieldCol>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <SectionHeading>Downloads</SectionHeading>
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
              <div className="flex flex-col gap-2 pb-3">
                {(libraries ?? []).map((library) => (
                  <div
                    key={library.path}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
                  >
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className="break-all font-mono text-label text-text">
                        {library.path}
                      </span>
                      {library.default && <Tag>Default</Tag>}
                      {!library.exists && <Tag variant="red">Not found</Tag>}
                    </span>
                    <span className="flex shrink-0 gap-2">
                      <Button
                        variant="secondary"
                        disabled={!library.exists}
                        onClick={() =>
                          onBridgeReady((bridge) =>
                            bridge.info.open_library(library.path),
                          )
                        }
                      >
                        Open
                      </Button>
                      {!library.default && (
                        <>
                          <Button
                            variant="secondary"
                            disabled={!library.exists}
                            onClick={() =>
                              settings.set_default_library(library.path)
                            }
                          >
                            Make default
                          </Button>
                          <Button
                            variant="secondary"
                            destructive
                            onClick={() => setRemoveTarget(library)}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
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
            Seasons in this folder will no longer appear in the Launcher. No
            files are deleted.
          </p>
          {removeTarget.seasons > 0 && (
            <p className="mt-3 text-body text-text-muted">
              This library contains {removeTarget.seasons}{" "}
              {removeTarget.seasons === 1 ? "season" : "seasons"}.
            </p>
          )}
        </ConfirmModal>
      )}
    </>
  );
}
