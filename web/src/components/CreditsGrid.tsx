"use client";

import Image from "next/image";
import { useState } from "react";
import {
  sectionOrder,
  users,
  type CreditRole,
  type CreditUser,
} from "@/content/credits";
import { ExternalLink } from "./ExternalLink";
import { SectionTitle } from "./SectionTitle";
import { withBasePath } from "@/lib/asset";

const ON_ERROR_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

const roleColor: Record<CreditRole, string> = {
  admin: "text-[#c61200]",
  moderator: "text-[#c8c840]",
  developer: "text-[#4a9fd4]",
  seniorhelper: "text-[#00f365]",
  helper: "text-[#2ecc71]",
  goon: "text-[#d060d0]",
};

function defaultAvatar(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return `https://cdn.discordapp.com/embed/avatars/${sum % 6}.png`;
}

function Avatar({ user }: { user: CreditUser }) {
  const initial = user.avatar || defaultAvatar(user.name);
  const [src, setSrc] = useState(initial);
  return (
    <Image
      src={withBasePath(src)}
      alt={user.name}
      width={400}
      height={400}
      className="block aspect-square w-full object-cover"
      onError={() => {
        if (src !== ON_ERROR_AVATAR) setSrc(ON_ERROR_AVATAR);
      }}
    />
  );
}

function DevCard({ user }: { user: CreditUser }) {
  const hasLinks = Boolean(user.github || user.dono);
  return (
    <div className="dev-card card-lift overflow-hidden">
      <Avatar user={user} />
      <div className="flex flex-1 flex-col border-t border-border p-3">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <span className="font-display text-base font-bold text-text">
            {user.name}
          </span>
          {hasLinks && (
            <span className="flex shrink-0 gap-1.5">
              {user.github && (
                <ExternalLink
                  href={user.github}
                  title="GitHub"
                  className="block opacity-60 transition-[opacity,transform] duration-150 hover:[transform:scale(1.15)] hover:opacity-100"
                >
                  <Image
                    src="https://cdn.simpleicons.org/github/FFFFFF"
                    alt="GitHub"
                    width={16}
                    height={16}
                    className="block h-4 w-4"
                  />
                </ExternalLink>
              )}
              {user.dono && (
                <ExternalLink
                  href={user.dono}
                  title="Donate"
                  className="block opacity-60 transition-[opacity,transform] duration-150 hover:[transform:scale(1.15)] hover:opacity-100"
                >
                  <Image
                    src={withBasePath("/media/others/piggy-bank.svg")}
                    alt="Donate"
                    width={16}
                    height={16}
                    className="block h-4 w-4"
                  />
                </ExternalLink>
              )}
            </span>
          )}
        </div>
        <div
          className={`mb-2 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.08em] ${roleColor[user.role]}`}
        >
          {user.title}
        </div>
        {user.tags.length > 0 && (
          <div className="mt-[0.4rem] flex flex-wrap content-start gap-[0.3rem]">
            {user.tags.map((tag) => (
              <span
                key={tag}
                className="whitespace-nowrap rounded-[3px] border border-border bg-surface-2 px-[0.45rem] py-[0.15rem] font-mono text-[0.6rem] text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CreditsGrid() {
  return (
    <div className="mb-8">
      {sectionOrder.map(({ id, label }) => {
        const sectionUsers = users.filter((user) => user.sections.includes(id));
        if (sectionUsers.length === 0) return null;
        return (
          <div key={id} className="mb-10">
            <SectionTitle className="">{label}</SectionTitle>
            <div className="dev-card-row grid items-start grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4 max-[32.5em]:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
              {sectionUsers.map((user) => (
                <DevCard key={user.name} user={user} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
