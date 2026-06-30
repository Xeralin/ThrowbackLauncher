"use client";

import { useEffect, useState } from "react";
import { BackHeading } from "@/components/BackHeading";
import { Button } from "@/components/Button";
import { Row, TextSetting } from "@/components/SettingsControls";
import { useSettings } from "@/lib/bridge";

export default function AccountPage() {
  const settings = useSettings();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    const onInvalid = (_field: string, message: string) => {
      setNotice(null);
      setError(message);
    };
    const onLoggedOut = (ok: boolean, message: string) => {
      setError(ok ? null : message);
      setNotice(ok ? message : null);
    };
    settings.invalid_setting.connect(onInvalid);
    settings.logged_out.connect(onLoggedOut);
    return () => {
      settings.invalid_setting.disconnect(onInvalid);
      settings.logged_out.disconnect(onLoggedOut);
    };
  }, [settings]);

  return (
    <>
      <BackHeading title="Account" />

      <div className="max-w-[560px] rounded-lg border border-border bg-surface p-5">
        {!settings ? (
          <p className="font-mono text-ui text-text-muted">Loading…</p>
        ) : (
          <>
            <Row label="Username">
              <TextSetting
                value={settings.username}
                onCommit={(value) => {
                  setError(null);
                  settings.set_username(value);
                }}
              />
            </Row>
            <Row label="Steam account">
              <TextSetting
                value={settings.steam_account}
                placeholder="required to download"
                onCommit={(value) => settings.set_steam_account(value)}
              />
            </Row>
            <Row label="Steam session">
              <Button
                variant="secondary"
                onClick={() => {
                  setError(null);
                  setNotice(null);
                  settings.logout();
                }}
              >
                Log out
              </Button>
            </Row>

            {notice && (
              <p className="mt-3 font-mono text-label text-success">
                {notice}
              </p>
            )}
            {error && (
              <p className="mt-3 font-mono text-label text-brand">{error}</p>
            )}
          </>
        )}
      </div>
    </>
  );
}
