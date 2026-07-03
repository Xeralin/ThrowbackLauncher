"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackHeading } from "@/components/BackHeading";
import { Callout } from "@/components/Callout";
import { TextSetting } from "@/components/SettingsControls";
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

export default function RpcPage() {
  const settings = useSettings();
  const router = useRouter();
  const [reverts, setReverts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!settings) return;
    const onInvalid = (field: string) =>
      setReverts((prev) => ({ ...prev, [field]: (prev[field] ?? 0) + 1 }));
    settings.invalid_setting.connect(onInvalid);
    return () => settings.invalid_setting.disconnect(onInvalid);
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
      <BackHeading
        title="Discord RPC"
        onBack={() => router.push("/settings")}
      />

      {!settings ? (
        <p className="font-mono text-ui text-text-muted">Loading…</p>
      ) : (
        <div className="flex max-w-[600px] flex-col gap-4">
          <Callout label="// NOTE" className="mb-0">
            See the{" "}
            <Link href="/faq/getting-started#how-do-i-set-up-the-discord-presence">
              setup guide
            </Link>{" "}
            in the FAQ.
          </Callout>
          <div className="flex w-fit items-center gap-6 rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
            <span className="font-display text-[1.05rem] font-bold text-text">
              Discord presence
            </span>
            <Switch
              size="sm"
              checked={settings.discord_rpc}
              onChange={(value) => settings.set_discord_rpc(value)}
            />
          </div>
          {settings.discord_rpc && (
            <div className="rounded-lg border border-border bg-surface px-5 py-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <FieldCol label="Application ID" span>
                  {field("discord_client_id", "required — your Discord app ID")}
                </FieldCol>
                <FieldCol label="Title">{field("discord_details")}</FieldCol>
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
      )}
    </>
  );
}
