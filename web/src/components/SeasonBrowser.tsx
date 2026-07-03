"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal, flushSync } from "react-dom";
import Image from "next/image";
import { AddToSteamButton } from "@/components/AddToSteam";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { SeasonDetail } from "@/components/SeasonDetail";
import { SplitTag, Tag } from "@/components/Tag";
import { useLaunch, usePlatform, useSettings, type Season } from "@/lib/bridge";
import { operatorsLocked, seasonRank } from "@/lib/seasons";

function BannerCard({
  season,
  onOpen,
}: {
  season: Season;
  onOpen: () => void;
}) {
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

const GRID_GAP = 16;
const ROW_UNIT = 190 + GRID_GAP;

const noopSubscribe = () => () => {};
const getTopbarSlot = () =>
  typeof document === "undefined"
    ? null
    : document.getElementById("topbar-actions");
const getServerSlot = () => null;

type CardAction =
  | { label: string; run: () => void; primary: boolean }
  | { steam: true };

function openOnKey(open: () => void) {
  return (event: React.KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  };
}

function SeasonTags({ season }: { season: Season }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <SplitTag
        variant={season.partial ? "amber" : "green"}
        left={`${season.sizeGb} GB`}
        right={season.partial ? "Resume" : "Installed"}
      />
      {operatorsLocked(season.key) && <Tag variant="red">Locked Operators</Tag>}
      {season.liberator && <Tag variant="liberator">Liberator</Tag>}
      {season.hm && <Tag variant="hm">Heated Metal</Tag>}
    </div>
  );
}

function DashCard({
  season,
  action,
  editing = false,
  dragging = false,
  wigglePhase = 0,
  spanW = 1,
  spanH = 1,
  cardRef,
  onOpen,
  onDragStart,
  onDragOver,
  onDragEnd,
  onResizePreview,
  onResizeCommit,
}: {
  season: Season;
  action: CardAction;
  editing?: boolean;
  dragging?: boolean;
  wigglePhase?: number;
  spanW?: number;
  spanH?: number;
  cardRef?: (el: HTMLDivElement | null) => void;
  onOpen: () => void;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDragEnd?: (cancelled: boolean) => void;
  onResizePreview?: (width: number, height: number) => void;
  onResizeCommit?: (width: number, height: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  function startResize(event: React.PointerEvent) {
    const root = rootRef.current;
    const grid = root?.parentElement;
    if (!root || !grid || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const pointerId = event.pointerId;
    const columns =
      getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    const unitW =
      (grid.clientWidth - (columns - 1) * GRID_GAP) / columns + GRID_GAP;
    const maxW = Math.min(3, columns);
    const startRect = root.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = spanW;
    const startH = spanH;
    let lastW = spanW;
    let lastH = spanH;

    function detach() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    }

    function onMove(move: PointerEvent) {
      if (move.pointerId !== pointerId) return;
      const width = Math.max(
        1,
        Math.min(
          maxW,
          Math.round(
            (startRect.width + move.clientX - startX + GRID_GAP) / unitW,
          ),
        ),
      );
      const height = Math.max(
        1,
        Math.min(
          3,
          Math.round(
            (startRect.height + move.clientY - startY + GRID_GAP) / ROW_UNIT,
          ),
        ),
      );
      if (width !== lastW || height !== lastH) {
        lastW = width;
        lastH = height;
        onResizePreview?.(width, height);
      }
    }

    function onUp(up: PointerEvent) {
      if (up.pointerId !== pointerId) return;
      detach();
      onResizeCommit?.(lastW, lastH);
    }

    function onCancel(cancel: PointerEvent) {
      if (cancel.pointerId !== pointerId) return;
      detach();
      onResizePreview?.(startW, startH);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }

  return (
    <div
      ref={(el) => {
        rootRef.current = el;
        cardRef?.(el);
      }}
      style={
        editing && !dragging
          ? { animationDelay: `-${wigglePhase * 90}ms` }
          : undefined
      }
      role={editing ? undefined : "button"}
      tabIndex={editing ? -1 : 0}
      draggable={editing}
      onClick={editing ? undefined : onOpen}
      onKeyDown={editing ? undefined : openOnKey(onOpen)}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
          "application/x-throwback-season",
          season.key,
        );
        onDragStart?.();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver?.();
      }}
      onDrop={(event) => event.preventDefault()}
      onDragEnd={(event) =>
        onDragEnd?.(event.dataTransfer.dropEffect === "none")
      }
      className={`group relative h-full rounded-lg border border-border bg-surface transition-[border-color,box-shadow,opacity] duration-200 ${
        editing
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer hover:border-border-brand card-glow-hover card-line-hover [--line-inset:9px]"
      } ${editing && !dragging ? "animate-wiggle" : ""} ${
        dragging ? "opacity-40" : ""
      } ${
        spanW === 3
          ? "col-span-2 max-[40em]:col-span-1 min-[80em]:col-span-3"
          : spanW === 2
            ? "col-span-2 max-[40em]:col-span-1"
            : ""
      } ${spanH === 3 ? "row-span-3" : spanH === 2 ? "row-span-2" : ""}`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[7px] will-change-transform">
        {season.splash ? (
          <Image
            src={season.splash}
            alt=""
            fill
            sizes="600px"
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0d12] to-[#0d0d0f]" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
      </div>
      {editing && (
        <span
          role="presentation"
          draggable={false}
          onDragStart={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onPointerDown={startResize}
          className="absolute -bottom-[3px] -right-[3px] z-10 h-4 w-4 touch-none cursor-nwse-resize text-text/90"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
            <path
              d="M 2.5 13.5 L 6 13.5 A 7.5 7.5 0 0 0 13.5 6 L 13.5 2.5"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 ${
          editing ? "pointer-events-none" : ""
        }`}
      >
        <div className="min-w-0">
          <div className="truncate font-display text-[1.05rem] font-bold leading-tight text-text">
            {season.code} {season.name}
          </div>
          <div className="mt-1.5">
            <SeasonTags season={season} />
          </div>
        </div>
        {"steam" in action ? (
          <AddToSteamButton season={season} />
        ) : (
          <Button
            variant={action.primary ? "primary" : "secondary"}
            onClick={(event) => {
              event.stopPropagation();
              action.run();
            }}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

export function SeasonBrowser({
  seasons,
  emptyMessage,
  layout = "banner",
  onReturn,
  searchable = false,
}: {
  seasons: Season[] | null;
  emptyMessage: ReactNode;
  layout?: "banner" | "dashboard";
  onReturn?: () => void;
  searchable?: boolean;
}) {
  const [selected, setSelected] = useState<Season | null>(null);
  const [query, setQuery] = useState("");
  const topbarSlot = useSyncExternalStore(
    noopSubscribe,
    getTopbarSlot,
    getServerSlot,
  );
  const [direction, setDirection] = useState<"none" | "forward" | "back">(
    "none",
  );
  const [returnScroll, setReturnScroll] = useState(0);
  const [editing, setEditing] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const [draftSizes, setDraftSizes] = useState<Record<string, string>>({});
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const lastRects = useRef(new Map<string, DOMRect>());
  const flipping = useRef(false);
  const os = usePlatform();
  const lc = useLaunch();
  const settings = useSettings();

  function open(season: Season) {
    setReturnScroll(window.scrollY);
    setDirection("forward");
    setSelected(season);
  }

  const back = useCallback(() => {
    flushSync(() => {
      setDirection("back");
      setSelected(null);
    });
    window.scrollTo(0, returnScroll);
    onReturn?.();
  }, [returnScroll, onReturn]);

  useLayoutEffect(() => {
    if (!editing) {
      lastRects.current = new Map();
      return;
    }
    const previous = lastRects.current;
    const next = new Map<string, DOMRect>();
    let moved = false;
    cardRefs.current.forEach((el, key) => {
      const rect = el.getBoundingClientRect();
      next.set(key, rect);
      const before = previous.get(key);
      if (!before) return;
      const dx = before.left - rect.left;
      const dy = before.top - rect.top;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: 260, easing: "cubic-bezier(0.2, 0, 0, 1)" },
        );
        moved = true;
      }
    });
    lastRects.current = next;
    if (moved) {
      flipping.current = true;
      window.setTimeout(() => {
        flipping.current = false;
      }, 300);
    }
  });

  useEffect(() => {
    if (!selected) return;
    function onBack(event: Event) {
      event.preventDefault();
      back();
    }
    window.addEventListener("throwback:back", onBack);
    return () => window.removeEventListener("throwback:back", onBack);
  }, [selected, back]);

  function cardAction(season: Season): CardAction {
    if (season.partial) {
      return { label: "Resume", run: () => open(season), primary: false };
    }
    if (os === "windows" || (os === "linux" && season.steamLinked)) {
      return { label: "Play", run: () => lc.launch(season.key), primary: true };
    }
    if (os === "linux") {
      return { steam: true };
    }
    return { label: "Open", run: () => open(season), primary: false };
  }

  const animation =
    direction === "forward"
      ? "animate-slide-from-right will-change-transform"
      : direction === "back"
        ? "animate-slide-from-left will-change-transform"
        : "";

  const trimmed = query.trim().toLowerCase();
  const visible =
    seasons && trimmed
      ? seasons.filter((season) => season.label.toLowerCase().includes(trimmed))
      : seasons;

  let listContent: ReactNode;
  if (seasons === null || visible === null) {
    listContent = (
      <p className="font-mono text-ui text-text-muted">Loading seasons…</p>
    );
  } else if (seasons.length === 0) {
    listContent = (
      <Callout label="// NOTE" className="max-w-[640px]">
        {emptyMessage}
      </Callout>
    );
  } else if (visible.length === 0) {
    listContent = (
      <p className="font-mono text-ui text-text-muted">No seasons found.</p>
    );
  } else if (layout === "dashboard") {
    const bySeason = new Map(visible.map((season) => [season.key, season]));
    const savedOrder = settings?.home_order ?? [];
    const baseKeys = [
      ...savedOrder.filter((key) => bySeason.has(key)),
      ...visible
        .filter((season) => !savedOrder.includes(season.key))
        .sort((a, b) => seasonRank(b.key) - seasonRank(a.key))
        .map((season) => season.key),
    ];
    const orderedKeys =
      draftOrder && draftOrder.every((key) => bySeason.has(key))
        ? draftOrder
        : baseKeys;

    function moveDragged(overKey: string) {
      if (!dragKey || dragKey === overKey || flipping.current) return;
      const current = draftOrder ?? baseKeys;
      const from = current.indexOf(dragKey);
      const to = current.indexOf(overKey);
      if (from === -1 || to === -1 || from === to) return;
      const next = [...current];
      next.splice(from, 1);
      next.splice(to, 0, dragKey);
      setDraftOrder(next);
    }

    function commitOrder() {
      if (!draftOrder) return;
      const displayed = new Set(draftOrder);
      const queue = [...draftOrder];
      const merged = savedOrder.map((key) =>
        displayed.has(key) ? (queue.shift() as string) : key,
      );
      settings?.set_home_order([...merged, ...queue]);
    }

    listContent = (
      <div
        className="grid auto-rows-[190px] grid-cols-2 gap-4 max-[40em]:grid-cols-1 min-[80em]:grid-cols-3"
        onDragOver={editing ? (event) => event.preventDefault() : undefined}
        onDrop={editing ? (event) => event.preventDefault() : undefined}
      >
        {orderedKeys.flatMap((key, index) => {
          const season = bySeason.get(key);
          if (!season) return [];
          return (
            <DashCard
              key={season.key}
              season={season}
              action={cardAction(season)}
              editing={editing}
              dragging={dragKey === season.key}
              wigglePhase={index % 4}
              spanW={Number(
                (
                  draftSizes[season.key] ?? settings?.home_sizes[season.key]
                )?.split("x")[0] ?? 1,
              )}
              spanH={Number(
                (
                  draftSizes[season.key] ?? settings?.home_sizes[season.key]
                )?.split("x")[1] ?? 1,
              )}
              onResizePreview={(width, height) =>
                setDraftSizes((prev) => ({
                  ...prev,
                  [season.key]: `${width}x${height}`,
                }))
              }
              onResizeCommit={(width, height) =>
                settings?.set_home_size(season.key, width, height)
              }
              cardRef={(el) => {
                if (el) cardRefs.current.set(season.key, el);
                else cardRefs.current.delete(season.key);
              }}
              onOpen={() => open(season)}
              onDragStart={() => setDragKey(season.key)}
              onDragOver={() => moveDragged(season.key)}
              onDragEnd={(cancelled) => {
                if (cancelled) setDraftOrder(null);
                else commitOrder();
                setDragKey(null);
              }}
            />
          );
        })}
      </div>
    );
  } else {
    listContent = (
      <div className="-mx-8 -mb-8 -mt-8 flex flex-col max-[48em]:-mx-5 max-[48em]:-mb-5 max-[48em]:-mt-5 min-[100em]:-mx-12 min-[100em]:-mb-10 min-[100em]:-mt-10">
        {visible.map((season) => (
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
        <>
          {searchable &&
            topbarSlot &&
            createPortal(
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 transition-colors focus-within:border-brand">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 flex-shrink-0 text-text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={query}
                  placeholder="Search seasons"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setQuery("");
                  }}
                  className="w-[180px] bg-transparent font-mono text-ui text-text outline-none placeholder:text-text-muted"
                />
              </div>,
              topbarSlot,
            )}
          {layout === "dashboard" &&
            topbarSlot &&
            (seasons?.length ?? 0) > 1 &&
            createPortal(
              <button
                type="button"
                aria-label={editing ? "Done arranging" : "Arrange seasons"}
                onClick={() => {
                  setEditing((value) => !value);
                  setDraftOrder(null);
                  setDraftSizes({});
                  setDragKey(null);
                }}
                className={`flex items-center rounded-md border bg-surface-2 px-2.5 py-[0.45rem] transition-colors ${
                  editing
                    ? "border-brand text-brand"
                    : "border-border text-text-muted hover:border-border-brand hover:text-text"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>,
              topbarSlot,
            )}
          {listContent}
        </>
      )}
    </div>
  );
}
