"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { InfoHint } from "@/components/InfoHint";
import { inputClasses } from "@/components/SettingsControls";
import { Prose } from "@/components/Prose";
import { SeasonTable } from "@/components/SeasonTable";
import { Switch } from "@/components/Switch";
import { Tabs, type TabItem } from "@/components/Tabs";
import {
  type GametypeNode,
  type LiberatorCapabilities,
  useLiberator,
  useSettings,
} from "@/lib/bridge";
import { showToast } from "@/lib/toast";
import {
  SUPPORTED_Y12,
  SUPPORTED_Y34,
  UNLOCK_ALL_SEASONS,
} from "@/config/liberator-builds";

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

type TabId = "playlist" | "modifications" | "support";

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
  path,
  selected,
  onPick,
  expanded,
  onToggle,
}: {
  nodes: GametypeNode[];
  path: string;
  selected: string;
  onPick: (id: string) => void;
  expanded: Set<string>;
  onToggle: (path: string) => void;
}) {
  return (
    <>
      {nodes.map((node, index) => {
        const nodePath = path ? `${path}.${index}` : String(index);
        return node.children.length === 0 ? (
          <button
            key={nodePath}
            type="button"
            onClick={() => onPick(node.id)}
            className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-ui transition-colors ${
              selected === node.id
                ? "text-brand"
                : "text-text-muted hover:text-text"
            }`}
          >
            <span className="h-4 w-4 flex-shrink-0" />
            {node.text}
          </button>
        ) : (
          <TreeBranch
            key={nodePath}
            node={node}
            path={nodePath}
            selected={selected}
            onPick={onPick}
            expanded={expanded}
            onToggle={onToggle}
          />
        );
      })}
    </>
  );
}

function TreeBranch({
  node,
  path,
  selected,
  onPick,
  expanded,
  onToggle,
}: {
  node: GametypeNode;
  path: string;
  selected: string;
  onPick: (id: string) => void;
  expanded: Set<string>;
  onToggle: (path: string) => void;
}) {
  const open = expanded.has(path);
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(path)}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-ui text-text-muted transition-colors hover:text-text"
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-[250ms] ${
            open ? "rotate-90" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
        {node.text}
      </button>
      {open && (
        <div className="ml-3 border-l border-border pl-2">
          <TreeNodes
            nodes={node.children}
            path={path}
            selected={selected}
            onPick={onPick}
            expanded={expanded}
            onToggle={onToggle}
          />
        </div>
      )}
    </div>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-3 font-mono text-label uppercase tracking-[0.12em] text-text-muted">
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

export default function LiberatorPage() {
  const settings = useSettings();
  const lib = useLiberator({ onError: (message) => showToast("error", message) });

  const [mods, setMods] = useState<Record<string, boolean>>({});
  const [selectedGametype, setSelectedGametype] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [tab, setTab] = useState<TabId>("support");
  const [prevAttached, setPrevAttached] = useState(lib.attached);

  const caps = lib.capabilities;
  const modsEnabled = lib.attached && lib.ready && lib.tier === "fullMods";
  const playlistEnabled = lib.ready && !!caps.playlist;
  const [prevPlaylistEnabled, setPrevPlaylistEnabled] =
    useState(playlistEnabled);

  if (lib.attached !== prevAttached) {
    setPrevAttached(lib.attached);
    if (!lib.attached) {
      setMods({});
      setSelectedGametype("");
      setExpanded(new Set());
    }
  }

  if (playlistEnabled !== prevPlaylistEnabled) {
    setPrevPlaylistEnabled(playlistEnabled);
    setTab(playlistEnabled ? "playlist" : "support");
  }

  const tabs: TabItem<TabId>[] = [
    { id: "playlist", label: "Playlist", disabled: !playlistEnabled },
    { id: "modifications", label: "Modifications", disabled: !modsEnabled },
    { id: "support", label: "Support" },
  ];

  function toggleMod(key: string, checked: boolean) {
    setMods((prev) => ({ ...prev, [key]: checked }));
    lib.setMod(key, checked);
  }

  function pickGametype(id: string) {
    setSelectedGametype(id);
    lib.setGametype(id);
  }

  function toggleExpand(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  const renderGroup = (group: (typeof LEFT_GROUPS)[number]) => (
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
  );

  return (
    <>
      <h1 className="mb-4 font-display text-[1.9rem] font-bold text-text">
        Liberator
      </h1>

      <Tabs
        tabs={tabs}
        active={tab}
        onSelect={setTab}
        trailing={
          <span className="flex items-center gap-2.5">
            {!(settings?.liberator_enabled ?? true) ? (
              <span className="text-text-muted">Disabled</span>
            ) : lib.attached ? (
              lib.status || "Attached"
            ) : (
              "Waiting for R6S to launch"
            )}
            <Switch
              size="sm"
              checked={settings?.liberator_enabled ?? true}
              onChange={(value) => settings?.set_liberator_enabled(value)}
            />
          </span>
        }
      />

      <div className="mt-4">
        {tab === "modifications" && (
          <div className="max-w-[720px]">
            <div className="grid grid-cols-2 gap-3 max-[40em]:grid-cols-1">
              <div className="flex flex-col justify-between gap-3">
                {LEFT_GROUPS.map(renderGroup)}
              </div>

              <div className="flex flex-col justify-between gap-3">
                {RIGHT_GROUPS.map(renderGroup)}

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
                  onChange={(event) =>
                    lib.setMadHouse(Number(event.target.value))
                  }
                  className={`${inputClasses} font-mono`}
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
                  path=""
                  selected={selectedGametype}
                  onPick={pickGametype}
                  expanded={expanded}
                  onToggle={toggleExpand}
                />
              </div>
            )}
          </div>
        )}

        {tab === "support" && (
          <Prose>
            <div className="flex flex-wrap items-start gap-x-6">
              <SeasonTable rows={SUPPORTED_Y12} />
              <SeasonTable rows={SUPPORTED_Y34} showEvent />
              <SeasonTable caption="Unlock All" rows={UNLOCK_ALL_SEASONS} />
            </div>
          </Prose>
        )}
      </div>

    </>
  );
}
