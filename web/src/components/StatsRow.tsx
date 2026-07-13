"use client";

import { useEffect, useState } from "react";
import { DiscordIcon } from "@/components/DiscordIcon";
import { ExternalLink } from "@/components/ExternalLink";
import { site } from "@/config/site";
import { fetchInviteCounts } from "@/lib/discord";

const cardClasses =
  "relative overflow-hidden rounded-lg border border-border bg-surface px-5 py-3";
const labelClasses =
  "mb-[0.4rem] font-mono text-[0.65rem] uppercase tracking-[0.15em] text-text-muted";
const subClasses = "mt-[0.2rem] text-[0.78rem] text-text-muted";
const valueClasses =
  "font-display text-[1.9rem] font-bold leading-none text-text";
const loadingClasses = "font-mono text-base leading-none text-text-muted";

export function StatsRow() {
  const [members, setMembers] = useState<string | null>(null);
  const [presence, setPresence] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchInviteCounts(site.discordInvite).then((counts) => {
      if (!active) return;
      setMembers(
        counts.members != null ? counts.members.toLocaleString() : "—",
      );
      setPresence(
        counts.presence != null ? counts.presence.toLocaleString() : "—",
      );
    });
    return () => {
      active = false;
    };
  }, []);

  const loading = members === null;

  return (
    <div className="grid grid-cols-2 gap-4 max-[32.5em]:grid-cols-1">
      <div className={cardClasses}>
        <span className="absolute inset-x-0 top-0 h-0.5 origin-left animate-scale-in-x bg-brand [animation-delay:0.1s]" />
        <ExternalLink
          href={site.discordUrl}
          aria-label="Operation Throwback Discord"
          className="absolute bottom-3 right-4 text-text opacity-60 transition-[opacity,transform] duration-150 hover:[transform:scale(1.15)] hover:opacity-100"
        >
          <DiscordIcon className="block h-4 w-4" />
        </ExternalLink>
        <div className={labelClasses}>Community Members</div>
        <div className={loading ? loadingClasses : valueClasses}>
          {loading ? "—" : members}
        </div>
        <div className={subClasses}>{presence ?? "—"} online now</div>
      </div>
      <div className={cardClasses}>
        <span className="absolute inset-x-0 top-0 h-0.5 origin-left animate-scale-in-x bg-brand [animation-delay:0.2s]" />
        <div className={labelClasses}>Last Updated</div>
        <div className={valueClasses}>{site.lastUpdated}</div>
        <div className={subClasses}>FAQ v{site.version}</div>
      </div>
    </div>
  );
}
