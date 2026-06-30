"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Prose } from "@/components/Prose";
import { SeasonTable } from "@/components/SeasonTable";
import {
  useLiberator,
  type LiberatorCapabilities,
  type GametypeNode,
} from "@/lib/bridge";
import {
  SUPPORTED_Y12,
  SUPPORTED_Y34,
  UNLOCK_ALL_SEASONS,
} from "@/config/liberator-builds";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Mod = { key: keyof LiberatorCapabilities; label: string; hint?: string };

const LEFT_GROUPS: { title: string; mods: Mod[] }[] = [
  {
    title: "Players",
    mods: [
      {
        key: "godMode",
        label: "Deathless Players and Hostage",
        hint: "Players and the hostage survive most damage. Only the host needs to enable it.",
      },
      {
        key: "unlimitedEquip",
        label: "Unlimited Equipment",
        hint: "Gives every player unlimited equipment and reinforcements. Only the host needs to enable it.",
      },
      {
        key: "unlimitedAmmo",
        label: "Unlimited Ammo",
        hint: "Gives every player unlimited ammo with no reloading. Enable it before spawning. It can be buggy, and only the host needs to enable it.",
      },
    ],
  },
  {
    title: "Map",
    mods: [
      {
        key: "harvard",
        label: "Replace House with Bartlett University",
        hint: "Loads Bartlett University instead of House when the match starts. Create a House playlist to use it, and only the host needs to enable it.",
      },
      {
        key: "oldHereford",
        label: "Enable Original Hereford",
        hint: "Replaces the Hereford rework with the original version. Only the host needs to enable it.",
      },
    ],
  },
  {
    title: "Display",
    mods: [
      {
        key: "displayBuild",
        label: "Build Number",
        hint: "Displays the build number in R6S. Toggle the Display Mode once in the R6S Options menu to make it appear.",
      },
    ],
  },
];

const RIGHT_GROUPS: { title: string; mods: Mod[] }[] = [
  {
    title: "Loadout",
    mods: [
      { key: "disablePrimary", label: "Disable Primary Weapon" },
      { key: "disableSecondary", label: "Disable Secondary Weapon" },
      { key: "disableSpecialGadget", label: "Disable Primary Gadget" },
      { key: "disableGadget", label: "Disable Secondary Gadget" },
    ],
  },
];

const TABS = [
  { id: "playlist", label: "Playlist" },
  { id: "modifications", label: "Modifications" },
  { id: "support", label: "Support" },
] as const;

const ALL_BUILDS: [string, string, string][] = [
  ...SUPPORTED_Y12,
  ...SUPPORTED_Y34,
  ...UNLOCK_ALL_SEASONS,
];

const EMPTY_ROW: [string, string, string] = [" ", " ", " "];

type TabId = (typeof TABS)[number]["id"];

function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <span ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        aria-label="Info"
        onClick={() => setOpen((value) => !value)}
        className="flex flex-shrink-0 text-text-muted"
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
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="16" y2="12" />
          <line x1="12" x2="12.01" y1="8" y2="8" />
        </svg>
      </button>
      {open && (
        <span className="absolute right-0 top-full z-20 mt-1.5 w-60 rounded-md border border-border bg-surface-2 px-3 py-2 text-left text-ui leading-snug text-text shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

function ModToggle({
  label,
  checked,
  disabled,
  onToggle,
  hint,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(!checked)}
        className="group flex flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-ui text-text transition disabled:cursor-not-allowed"
      >
        <span
          className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[3px] border transition group-disabled:opacity-40 ${
            checked ? "border-brand bg-brand" : "border-border"
          }`}
        >
          {checked && (
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3"
              fill="none"
              stroke="white"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        {label}
      </button>
      {hint && <InfoHint text={hint} />}
    </div>
  );
}

function TreeNodes({
  nodes,
  selected,
  onPick,
}: {
  nodes: GametypeNode[];
  selected: string;
  onPick: (id: string) => void;
}) {
  return (
    <>
      {nodes.map((node) =>
        node.children.length === 0 ? (
          <button
            key={node.id}
            type="button"
            onClick={() => onPick(node.id)}
            className={`block w-full rounded-md px-2 py-1 text-left text-ui transition-colors ${
              selected === node.id ? "text-brand" : "text-text-muted hover:text-text"
            }`}
          >
            {node.text}
          </button>
        ) : (
          <TreeBranch
            key={node.id}
            node={node}
            selected={selected}
            onPick={onPick}
          />
        ),
      )}
    </>
  );
}

function TreeBranch({
  node,
  selected,
  onPick,
}: {
  node: GametypeNode;
  selected: string;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-ui text-text-muted transition-colors hover:text-text"
      >
        <span
          className={`text-label transition-transform ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
        {node.text}
      </button>
      {open && (
        <div className="ml-3 border-l border-border pl-2">
          <TreeNodes nodes={node.children} selected={selected} onPick={onPick} />
        </div>
      )}
    </div>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-3 font-mono text-label uppercase tracking-[0.2em] text-text-muted">
      {children}
    </div>
  );
}

function GroupBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <GroupLabel>{title}</GroupLabel>
      {children}
    </div>
  );
}

export function LiberatorView() {
  const [error, setError] = useState<string | null>(null);
  const lib = useLiberator({ onError: setError });

  const [mods, setMods] = useState<Record<string, boolean>>({});
  const [selectedGametype, setSelectedGametype] = useState("");
  const [tab, setTab] = useState<TabId>("playlist");

  const caps = lib.capabilities;
  const modsEnabled = lib.attached && lib.tier === "fullMods";

  const inUseRows: [string, string, string][] = [
    lib.attached && lib.buildNumber
      ? (ALL_BUILDS.find((row) => row[2] === lib.buildNumber) ?? [
          "",
          lib.seasonName,
          lib.buildNumber,
        ])
      : EMPTY_ROW,
  ];

  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    modifications: null,
    playlist: null,
    support: null,
  });
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useIsoLayoutEffect(() => {
    const el = tabRefs.current[tab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  useEffect(() => {
    function remeasure() {
      const el = tabRefs.current[tab];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    window.addEventListener("resize", remeasure);
    document.fonts?.ready.then(remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, [tab]);

  function toggleMod(key: string, checked: boolean) {
    setMods((prev) => ({ ...prev, [key]: checked }));
    lib.setMod(key, checked);
  }

  function pickGametype(id: string) {
    setSelectedGametype(id);
    lib.setGametype(id);
  }

  return (
    <>
      <h1 className="mb-6 font-display text-[1.9rem] font-bold text-text">
        Liberator
      </h1>

      <div className="flex flex-wrap items-end justify-between gap-x-4 border-b border-border">
        <div className="relative flex gap-1">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              ref={(el) => {
                tabRefs.current[entry.id] = el;
              }}
              type="button"
              onClick={() => setTab(entry.id)}
              className={`px-4 py-2 font-mono text-label uppercase tracking-[0.12em] transition-colors ${
                tab === entry.id ? "text-text" : "text-text-muted hover:text-text"
              }`}
            >
              {entry.label}
            </button>
          ))}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[-1px] h-[2px] bg-brand transition-[left,width] duration-300 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />
        </div>
        <span className="pb-2 font-display text-[1.05rem] font-bold text-text">
          {lib.attached ? lib.status || "Attached" : "Waiting for R6S to launch"}
        </span>
      </div>

      <div className="mt-5">
        {tab === "modifications" && (
          <div className="max-w-[720px]">
            {lib.tier === "unsupported" && (
              <Callout variant="warning" label="// UNSUPPORTED" className="mb-4">
                This game build is not supported.
              </Callout>
            )}

            <div className="grid grid-cols-2 gap-3 max-[40em]:grid-cols-1">
              <div className="flex flex-col justify-between gap-3">
                {LEFT_GROUPS.map((group) => (
                  <GroupBox key={group.title} title={group.title}>
                    <div className="p-2 pt-1">
                      {group.mods.map((mod) => (
                        <ModToggle
                          key={mod.key}
                          label={mod.label}
                          checked={!!mods[mod.key]}
                          disabled={!modsEnabled || !caps[mod.key]}
                          onToggle={(value) => toggleMod(mod.key, value)}
                          hint={mod.hint}
                        />
                      ))}
                    </div>
                  </GroupBox>
                ))}
              </div>

              <div className="flex flex-col justify-between gap-3">
                {RIGHT_GROUPS.map((group) => (
                  <GroupBox key={group.title} title={group.title}>
                    <div className="p-2 pt-1">
                      {group.mods.map((mod) => (
                        <ModToggle
                          key={mod.key}
                          label={mod.label}
                          checked={!!mods[mod.key]}
                          disabled={!modsEnabled || !caps[mod.key]}
                          onToggle={(value) => toggleMod(mod.key, value)}
                          hint={mod.hint}
                        />
                      ))}
                    </div>
                  </GroupBox>
                ))}

                <GroupBox title="Match">
                  <div className="p-2 pt-1">
                    <div className="flex gap-2 px-2 pb-2 pt-1">
                      <Button
                        variant="secondary"
                        disabled={!modsEnabled || !caps.endRound}
                        onClick={lib.endRound}
                      >
                        End Round
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={!modsEnabled || !caps.endMatch}
                        onClick={lib.endMatch}
                      >
                        End Match
                      </Button>
                    </div>
                    <ModToggle
                      label="Infinite Match Time"
                      checked={!!mods.infiniteTime}
                      disabled={!modsEnabled || !caps.infiniteTime}
                      onToggle={(value) => toggleMod("infiniteTime", value)}
                    />
                    <ModToggle
                      label="Brain-Dead AI"
                      checked={!!mods.disableAI}
                      disabled={!modsEnabled || !caps.disableAI}
                      onToggle={(value) => toggleMod("disableAI", value)}
                      hint="Enable this before the match starts."
                    />
                  </div>
                </GroupBox>
              </div>
            </div>

            {caps.madHouse && lib.madHouseVariants.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <span className="font-mono text-label uppercase tracking-[0.12em] text-text-muted">
                  Mad House
                </span>
                <select
                  defaultValue={0}
                  onChange={(event) => lib.setMadHouse(Number(event.target.value))}
                  className="rounded-md border border-border bg-surface-2 px-3 py-[0.4rem] font-mono text-ui text-text outline-none focus:border-brand"
                >
                  {lib.madHouseVariants.map((variant, index) => (
                    <option key={variant} value={index}>
                      {variant}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {tab === "playlist" && (
          <div className="max-w-[720px]">
            {caps.playlist && lib.tree && (
              <div className="rounded-lg border border-border bg-surface p-4">
                <TreeNodes
                  nodes={lib.tree.children}
                  selected={selectedGametype}
                  onPick={pickGametype}
                />
              </div>
            )}
          </div>
        )}

        {tab === "support" && (
          <Prose>
            <div className="flex flex-wrap items-start gap-x-6">
              <SeasonTable rows={SUPPORTED_Y12} />
              <SeasonTable rows={SUPPORTED_Y34} />
              <div className="flex flex-col justify-between gap-6 self-stretch">
                <SeasonTable fill rows={inUseRows} />
                <SeasonTable fill caption="Unlock All" rows={UNLOCK_ALL_SEASONS} />
              </div>
            </div>
          </Prose>
        )}
      </div>

      {error && (
        <Callout variant="warning" label="// ERROR" className="mt-5 max-w-[720px]">
          {error}
        </Callout>
      )}
    </>
  );
}
