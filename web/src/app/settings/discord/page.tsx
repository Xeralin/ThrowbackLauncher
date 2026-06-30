"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BackHeading } from "@/components/BackHeading";
import { Callout } from "@/components/Callout";
import { ExternalLink } from "@/components/ExternalLink";
import { Row, TextSetting } from "@/components/SettingsControls";
import { Switch } from "@/components/Switch";
import { useSettings } from "@/lib/bridge";

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
    <label className={`flex min-w-0 flex-col gap-1 ${span ? "col-span-2" : ""}`}>
      <span className="font-mono text-label uppercase tracking-[0.12em] text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function DiscordPage() {
  const settings = useSettings();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    const onInvalid = (_field: string, message: string) => setError(message);
    settings.invalid_setting.connect(onInvalid);
    return () => settings.invalid_setting.disconnect(onInvalid);
  }, [settings]);

  const rpc = settings?.rpc_config ?? {};
  const field = (key: string, placeholder?: string) => (
    <TextSetting
      className="w-full"
      value={rpc[key] ?? ""}
      placeholder={placeholder}
      onCommit={(value) => {
        setError(null);
        settings?.set_rpc_field(key, value);
      }}
    />
  );

  return (
    <>
      <BackHeading title="Discord" />

      {!settings ? (
        <p className="font-mono text-ui text-text-muted">Loading…</p>
      ) : (
        <div className="flex max-w-[640px] flex-col gap-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <Row label="Discord presence">
              <Switch
                checked={settings.discord_rpc}
                onChange={(value) => settings.set_discord_rpc(value)}
              />
            </Row>
          </div>

          {settings.discord_rpc && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <FieldCol label="Application ID" span>
                  {field("discord_client_id", "required — your Discord app ID")}
                </FieldCol>
                <FieldCol label="Title">{field("discord_details")}</FieldCol>
                <FieldCol label="State">{field("discord_state", "optional")}</FieldCol>
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

              <Callout variant="notice" label="// SETUP" className="mt-4">
                Needs your own Discord app — create one at{" "}
                <ExternalLink href="https://discord.com/developers/applications">
                  discord.com/developers
                </ExternalLink>{" "}
                and paste the Application ID above.
              </Callout>
            </div>
          )}

          {error && (
            <p className="font-mono text-label text-brand">{error}</p>
          )}
        </div>
      )}
    </>
  );
}
