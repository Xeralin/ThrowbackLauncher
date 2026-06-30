"use client";

import { NavCard, CardGrid } from "@/components/NavCard";
import { usePlatform } from "@/lib/bridge";

export default function SettingsPage() {
  const os = usePlatform();

  return (
    <>
      <h1 className="mb-6 font-display text-[1.9rem] font-bold text-text">
        Settings
      </h1>

      <CardGrid>
        <NavCard
          href="/settings/account"
          title="Account"
          desc="Username, Steam account and login."
          arrow="→ LEARN MORE"
        />
        <NavCard
          href="/settings/downloads"
          title="Downloads"
          desc="Download speed, disk usage and cache."
          arrow="→ LEARN MORE"
        />
        <NavCard
          href="/settings/discord"
          title="Discord"
          desc="Discord rich presence."
          arrow="→ LEARN MORE"
        />
        {os !== "windows" && os !== "macos" && (
          <NavCard
            href="/settings/multiplayer"
            title="RadminVPN"
            desc="Bridge a Windows VM for LAN play with friends."
            arrow="→ LEARN MORE"
          />
        )}
      </CardGrid>
    </>
  );
}
