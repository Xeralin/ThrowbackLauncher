"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/Button";
import { SeasonDetail } from "@/components/SeasonDetail";
import { useLaunch, usePlatform, type Season } from "@/lib/bridge";

function BannerCard({ season, onOpen }: { season: Season; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative block h-[210px] w-full overflow-hidden text-left"
    >
      {season.splash ? (
        <Image
          src={season.splash}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center transition-transform duration-200 ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0d12] to-[#0d0d0f]" />
      )}

      <div className="absolute inset-0 bg-black/40 transition-colors duration-200 group-hover:bg-black/20" />

      <div className="absolute left-10 top-1/2 -translate-y-1/2 font-display text-[1.9rem] font-bold leading-none text-text">
        {season.code}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-28">
        <span className="font-display text-[2.4rem] font-bold leading-none text-text [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
          {season.name}
        </span>
      </div>
    </button>
  );
}

function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={`rounded-[3px] border px-[0.4rem] py-[0.1rem] font-mono text-label ${className}`}
    >
      {children}
    </span>
  );
}

function SeasonTags({ season }: { season: Season }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {season.partial ? (
        <Tag className="border-[#3a3000] bg-[#1a1500] text-accent">Resume</Tag>
      ) : (
        <Tag className="border-[#1a3a1a] bg-[#0a1a0a] text-success">Installed</Tag>
      )}
      {season.liberator && (
        <Tag className="border-border text-text-muted">Liberator</Tag>
      )}
      {season.hm && (
        <Tag className="border-border-brand text-text-muted">Heated Metal</Tag>
      )}
    </div>
  );
}

type CardAction = { label: string; run: () => void; primary: boolean };

function HeroCard({
  season,
  action,
  onOpen,
}: {
  season: Season;
  action: CardAction;
  onOpen: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="group relative mb-4 h-[260px] cursor-pointer overflow-hidden rounded-lg border border-border"
    >
      {season.splash ? (
        <Image
          src={season.splash}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transition-transform duration-200 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0d12] to-[#0d0d0f]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,13,15,0.95)] via-[rgba(13,13,15,0.45)] to-transparent" />

      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="font-mono text-label tracking-[0.12em] text-brand">
            {season.code}
          </div>
          <div className="font-display text-[2.4rem] font-bold leading-none text-text">
            {season.name}
          </div>
          <div className="mt-2">
            <SeasonTags season={season} />
          </div>
        </div>
        <Button
          variant="primary"
          onClick={(event) => {
            event.stopPropagation();
            action.run();
          }}
        >
          {action.label}
        </Button>
      </div>
    </div>
  );
}

function DashCard({
  season,
  action,
  onOpen,
}: {
  season: Season;
  action: CardAction;
  onOpen: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-surface transition-[border-color] duration-200 hover:border-border-brand"
    >
      <div className="relative h-[110px]">
        {season.splash ? (
          <Image
            src={season.splash}
            alt=""
            fill
            sizes="360px"
            className="object-cover object-center transition-transform duration-200 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0d12] to-[#0d0d0f]" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <div className="font-mono text-label tracking-[0.1em] text-brand">
            {season.code}
          </div>
          <div className="truncate font-display text-[1.05rem] font-bold leading-tight text-text">
            {season.name}
          </div>
        </div>
        <Button
          variant={action.primary ? "primary" : "secondary"}
          onClick={(event) => {
            event.stopPropagation();
            action.run();
          }}
        >
          {action.label}
        </Button>
      </div>
    </div>
  );
}

export function SeasonBrowser({
  seasons,
  emptyMessage,
  layout = "banner",
}: {
  seasons: Season[] | null;
  emptyMessage: string;
  layout?: "banner" | "dashboard";
}) {
  const [selected, setSelected] = useState<Season | null>(null);
  const [direction, setDirection] = useState<"none" | "forward" | "back">(
    "none",
  );
  const os = usePlatform();
  const lc = useLaunch();

  function open(season: Season) {
    setDirection("forward");
    setSelected(season);
  }

  function back() {
    setDirection("back");
    setSelected(null);
  }

  function cardAction(season: Season): CardAction {
    if (season.partial) {
      return { label: "Resume", run: () => open(season), primary: false };
    }
    if (os === "windows" || (os === "linux" && season.steamLinked)) {
      return { label: "▶ Play", run: () => lc.launch(season.key), primary: true };
    }
    if (os === "linux") {
      return { label: "Add to Steam", run: () => open(season), primary: false };
    }
    return { label: "Open", run: () => open(season), primary: false };
  }

  const animation =
    direction === "forward"
      ? "animate-slide-from-right will-change-transform"
      : direction === "back"
        ? "animate-slide-from-left will-change-transform"
        : "";

  let listContent: ReactNode;
  if (seasons === null) {
    listContent = (
      <p className="font-mono text-ui text-text-muted">Loading seasons…</p>
    );
  } else if (seasons.length === 0) {
    listContent = (
      <p className="font-mono text-ui text-text-muted">{emptyMessage}</p>
    );
  } else if (layout === "dashboard") {
    const installed = seasons.filter((season) => !season.partial);
    const hero = installed[installed.length - 1];
    const rest = seasons.filter((season) => season !== hero);
    listContent = (
      <div>
        {hero && (
          <HeroCard
            season={hero}
            action={cardAction(hero)}
            onOpen={() => open(hero)}
          />
        )}
        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-4 max-[40em]:grid-cols-1 min-[80em]:grid-cols-3">
            {rest.map((season) => (
              <DashCard
                key={season.key}
                season={season}
                action={cardAction(season)}
                onOpen={() => open(season)}
              />
            ))}
          </div>
        )}
      </div>
    );
  } else {
    listContent = (
      <div className="-mx-8 -mb-8 -mt-8 flex flex-col max-[48em]:-mx-5 max-[48em]:-mb-5 max-[48em]:-mt-5 min-[100em]:-mx-12 min-[100em]:-mb-10 min-[100em]:-mt-10">
        {seasons.map((season) => (
          <BannerCard
            key={season.key}
            season={season}
            onOpen={() => open(season)}
          />
        ))}
      </div>
    );
  }

  return (
    <div key={selected ? selected.key : "list"} className={animation}>
      {selected ? (
        <SeasonDetail season={selected} onBack={back} />
      ) : (
        listContent
      )}
    </div>
  );
}
