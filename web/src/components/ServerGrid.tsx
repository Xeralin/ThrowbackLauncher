"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { servers, type ServerEntry } from "@/content/servers";
import { fetchInviteCounts } from "@/lib/discord";
import { ExternalLink } from "./ExternalLink";

function ServerCard({ server }: { server: ServerEntry }) {
  const [members, setMembers] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchInviteCounts(server.invite).then((counts) => {
      if (!active) return;
      setMembers(
        counts.members != null
          ? `${counts.members.toLocaleString()} members`
          : "",
      );
    });
    return () => {
      active = false;
    };
  }, [server.invite]);

  return (
    <div className="server-card card-lift relative overflow-visible">
      <div className="relative h-[90px] flex-shrink-0 overflow-hidden rounded-t-[10px] bg-surface-2">
        <Image
          src={server.banner}
          alt={`${server.name} banner`}
          fill
          sizes="(max-width: 520px) 100vw, 280px"
          className="object-cover"
        />
      </div>
      <Image
        src={server.logo}
        alt={`${server.name} logo`}
        width={48}
        height={48}
        className="absolute left-[14px] top-[62px] z-10 h-12 w-12 rounded-full border-[3px] border-surface bg-surface-2 object-cover"
      />
      <div className="flex flex-1 flex-col px-4 pb-4 pt-7">
        <div className="mb-[0.2rem] font-display text-[1.05rem] font-bold text-text">
          {server.name}
        </div>
        <div className="mb-2 font-mono text-[0.65rem] text-text-muted">
          {members === null ? "Loading…" : members}
        </div>
        <p className="mb-[0.85rem] flex-1 text-[0.82rem] leading-[1.5] text-text-muted">
          {server.description}
        </p>
        <ExternalLink
          href={`https://discord.gg/${server.invite}`}
          className="self-start rounded-[5px] bg-brand px-4 py-[0.45rem] text-[0.85rem] text-white no-underline transition-colors hover:bg-[#a01020]"
        >
          Join Discord
        </ExternalLink>
      </div>
    </div>
  );
}

export function ServerGrid() {
  return (
    <div className="server-grid mb-8 grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-5 max-[32.5em]:grid-cols-1">
      {servers.map((server) => (
        <ServerCard key={server.invite} server={server} />
      ))}
    </div>
  );
}
