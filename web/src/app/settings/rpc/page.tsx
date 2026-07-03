"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackHeading } from "@/components/BackHeading";
import { Note } from "@/components/Note";
import { TextSetting } from "@/components/SettingsControls";
import { Switch } from "@/components/Switch";
import { useSettings } from "@/lib/bridge";

function FieldCol({
  label,
  children,
  span,
  required,
}: {
  label: string;
  children: ReactNode;
  span?: boolean;
  required?: boolean;
}) {
  return (
    <label
      className={`flex min-w-0 flex-col gap-1 ${span ? "col-span-2" : ""}`}
    >
      <span className="font-mono text-label uppercase tracking-[0.12em] text-text-muted">
        {label}
        {required && (
          <span className="ml-0.5 text-[0.95rem] leading-none text-brand">
            *
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

const TOKENS: [string, string][] = [
  ["[season]", "Y1S1 Black Ice"],
  ["[code]", "Y1S1"],
  ["[operation]", "Black Ice"],
];

const LEFT = { textAlign: "left" as const };

function CopyGlyph({ done }: { done: boolean }) {
  return done ? (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function fallbackCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(area);
  return ok;
}

function TokenTable() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(token: string) {
    const flash = () => {
      setCopied(token);
      window.setTimeout(
        () => setCopied((current) => (current === token ? null : current)),
        1200,
      );
    };
    navigator.clipboard.writeText(token).then(flash, () => {
      if (fallbackCopy(token)) flash();
    });
  }

  return (
    <div className="prose w-full shrink-0 min-[52em]:w-[236px]">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr>
              <th style={LEFT}>Token</th>
              <th style={LEFT}>Example</th>
            </tr>
          </thead>
          <tbody>
            {TOKENS.map(([token, example]) => (
              <tr key={token}>
                <td style={LEFT}>
                  <span className="flex items-center justify-between gap-2">
                    {token}
                    <button
                      type="button"
                      onClick={() => copy(token)}
                      aria-label={`Copy ${token}`}
                      className="shrink-0 text-text-muted transition-colors hover:text-text"
                    >
                      <CopyGlyph done={copied === token} />
                    </button>
                  </span>
                </td>
                <td style={LEFT}>{example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
        <div className="flex max-w-[860px] flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
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
            <Note>
              See the{" "}
              <Link href="/faq/getting-started#how-do-i-set-up-the-discord-presence">
                setup guide
              </Link>{" "}
              in the FAQ.
            </Note>
          </div>
          {settings.discord_rpc && (
            <div className="flex flex-col gap-4 min-[52em]:flex-row min-[52em]:items-start">
              <div className="rounded-lg border border-border bg-surface px-5 py-4 min-[52em]:flex-1">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <FieldCol label="Application ID" span required>
                    {field("discord_client_id")}
                  </FieldCol>
                  <FieldCol label="Details">
                    {field("discord_details")}
                  </FieldCol>
                  <FieldCol label="State">{field("discord_state")}</FieldCol>
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
              <TokenTable />
            </div>
          )}
        </div>
      )}
    </>
  );
}
