import type { ReactNode } from "react";
import Image from "next/image";
import { Tag } from "@/components/Tag";
import type { SeasonInfoEntry, InfoOperator, InfoMap } from "@/config/season-info";

function assetSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ø/g, "o")
    .replace(/ /g, "-");
}

function OperatorCard({ op }: { op: InfoOperator }) {
  return (
    <div className="flex h-[80px] items-stretch overflow-hidden rounded-lg border border-border bg-surface">
      <div className="relative w-14 shrink-0 border-r border-border bg-surface-2">
        <Image
          src={`/info/ops/${op.img ?? assetSlug(op.name)}.webp`}
          alt=""
          fill
          sizes="56px"
          className="object-cover object-[50%_20%]"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate font-display text-[1.05rem] font-bold leading-tight text-text">
            {op.name}
          </span>
          <Tag>{op.side === "attacker" ? "Attacker" : "Defender"}</Tag>
        </div>
        <p className="line-clamp-2 min-h-[2.75em] text-[0.8rem] leading-snug text-text-muted">
          <span className="font-semibold text-text">{op.gadgetName}</span>
          {" — "}
          {op.gadgetDesc}
        </p>
      </div>
    </div>
  );
}

function MapCard({ map }: { map: InfoMap }) {
  return (
    <div className="relative h-[80px] overflow-hidden rounded-lg border border-border">
      <Image
        src={`/info/maps/${map.img ?? assetSlug(map.name)}.webp`}
        alt=""
        fill
        sizes="320px"
        className="object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
      <div className="absolute bottom-2 left-3 flex items-center gap-2">
        <span className="font-display text-[1.05rem] font-bold text-text">
          {map.name}
        </span>
        {map.kind === "rework" && <Tag>Rework</Tag>}
      </div>
    </div>
  );
}

function InfoBox({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-border ${className}`}
    >
      <p className="border-b border-border bg-surface-2 px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.05em] text-text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

export function SeasonInfo({ entry }: { entry: SeasonInfoEntry }) {
  const hasCards = entry.operators.length > 0 || entry.maps.length > 0;

  const summary = (
    <p className="text-body leading-[1.75] text-text-muted">{entry.summary}</p>
  );

  const cards = (
    <div className="grid gap-3 @lg:grid-cols-2">
      {entry.operators.map((op) => (
        <OperatorCard key={op.name} op={op} />
      ))}
      {entry.maps.map((map) => (
        <MapCard key={map.name} map={map} />
      ))}
    </div>
  );

  const released = (
    <InfoBox title="Released" className="mt-[0.37rem]">
      <p className="px-3 py-1.5 text-[0.78rem] leading-[1.45] text-text-muted">
        {entry.release}
      </p>
    </InfoBox>
  );

  const highlights = (
    <InfoBox title="Highlights">
      {entry.highlights.map((highlight) => (
        <p
          key={highlight}
          className="border-b border-border px-3 py-1.5 text-[0.78rem] leading-[1.45] text-text-muted last:border-b-0"
        >
          {highlight}
        </p>
      ))}
    </InfoBox>
  );

  if (!hasCards) {
    return (
      <div className="grid max-w-5xl items-start gap-5 min-[48em]:grid-cols-[minmax(0,1fr)_260px]">
        {summary}
        <div className="flex flex-col gap-2">
          {released}
          {highlights}
        </div>
      </div>
    );
  }

  return (
    <div className="grid max-w-5xl items-start gap-x-5 min-[48em]:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-w-0 flex-col gap-3">
        {summary}
        <div className="@container">{cards}</div>
      </div>
      <div className="flex flex-col gap-3">
        {released}
        {highlights}
      </div>
    </div>
  );
}
