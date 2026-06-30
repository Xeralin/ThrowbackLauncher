"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";

export type ThrowbackOS = "linux" | "windows" | "macos";

export type Season = {
  key: string;
  code: string;
  name: string;
  label: string;
  sizeGb: number;
  liberator: boolean;
  heatedMetal: boolean;
  hm: boolean;
  partial: boolean;
  steamLinked: boolean;
  splash: string | null;
};

type QtSignal = {
  connect(callback: (...args: never[]) => void): void;
  disconnect(callback: (...args: never[]) => void): void;
};

type PlatformBridge = { os: ThrowbackOS };
type LibraryBridge = {
  seasons: Season[];
  home(callback: (seasons: Season[]) => void): void;
};

export type InfoSnapshot = {
  version: string;
  downloads: number;
  diskUsageGb: number;
  freeSpaceGb: number;
};

type InfoBridge = {
  snapshot(callback: (info: InfoSnapshot) => void): void;
};

export type LaunchStatus = { installed: boolean; hm: boolean; partial: boolean };

type LaunchObject = {
  status(key: string, callback: (status: LaunchStatus) => void): void;
  launch(key: string): void;
};

export type ShearsKind = "videos" | "events" | "textures";

export type ShearsTier = { level: number; quality: string; size: number };

export type ShearsScan = {
  total: number;
  videos: number;
  events: number;
  tiers: ShearsTier[];
};

export type ShearsCutResult = {
  ok: boolean;
  message: string;
  freed: number;
  scan: ShearsScan;
};

type ShearsObject = {
  scan(key: string, callback: (scan: ShearsScan) => void): void;
  cut(
    key: string,
    kind: ShearsKind,
    level: number,
    callback: (result: ShearsCutResult) => void,
  ): void;
};

export type UninstallTargets = {
  folder: string;
  prefix: string;
  shortcut: boolean;
};

type UninstallObject = {
  preview(key: string, callback: (targets: UninstallTargets) => void): void;
  run(key: string): void;
};

export type SettingsBridge = {
  username: string;
  steam_account: string;
  max_downloads: number;
  discord_rpc: boolean;
  rpc_config: Record<string, string>;
  download_bounds: { min: number; max: number };
  set_username(value: string): void;
  set_steam_account(value: string): void;
  set_max_downloads(value: number): void;
  set_discord_rpc(value: boolean): void;
  set_rpc_field(key: string, value: string): void;
  logout(): void;
  clear_cache(): void;
  username_changed: QtSignal;
  steam_account_changed: QtSignal;
  max_downloads_changed: QtSignal;
  discord_rpc_changed: QtSignal;
  rpc_config_changed: QtSignal;
  invalid_setting: QtSignal;
  logged_out: QtSignal;
  cache_cleared: QtSignal;
};

type DownloaderSnapshot = {
  state: string;
  progress: number;
  running: boolean;
  activeKey: string;
};

export type ProtonOption = { index: number; display: string };

type DownloaderObject = {
  start(key: string, enableHm: boolean): void;
  verify(key: string, isHm: boolean): void;
  cancel(): void;
  submit_login(text: string): void;
  submit_account_login(account: string, password: string): void;
  snapshot(callback: (snapshot: DownloaderSnapshot) => void): void;
  log_history(callback: (history: string) => void): void;
  is_steam_running(callback: (running: boolean) => void): void;
  proton_options(callback: (protons: ProtonOption[]) => void): void;
  steam_setup(key: string, index: number): void;
};

export type RadminSnapshot = {
  vboxInstalled: boolean;
  radminIp: string;
  iface: string;
  bridgePresent: boolean;
  bridgeReady: boolean;
  competingRoute: string;
  busy: boolean;
};

type RadminObject = {
  snapshot(callback: (snapshot: RadminSnapshot) => void): void;
  set_radmin_ip(ip: string, callback: (ok: boolean) => void): void;
  vms(callback: (vms: string[]) => void): void;
  create_bridge(ip: string): void;
  remove_bridge(): void;
  attach(vm: string): void;
};

export type LiberatorCapabilities = {
  godMode: boolean;
  disableAI: boolean;
  unlimitedAmmo: boolean;
  unlimitedEquip: boolean;
  infiniteTime: boolean;
  disablePrimary: boolean;
  disableSecondary: boolean;
  disableSpecialGadget: boolean;
  disableGadget: boolean;
  harvard: boolean;
  oldHereford: boolean;
  displayBuild: boolean;
  madHouse: boolean;
  endRound: boolean;
  endMatch: boolean;
  playlist: boolean;
  unlockAll: boolean;
};

export type LiberatorState = {
  attached: boolean;
  seasonName: string;
  buildNumber: string;
  tier: "fullMods" | "unlockAll" | "unsupported" | "";
  ready: boolean;
  status: string;
  capabilities: LiberatorCapabilities;
  madHouseVariants: string[];
};

export type GametypeNode = { text: string; id: string; children: GametypeNode[] };

type LiberatorObject = {
  snapshot(callback: (state: LiberatorState) => void): void;
  tree_snapshot(callback: (tree: GametypeNode | null) => void): void;
  is_game_running(callback: (running: boolean) => void): void;
  start(): void;
  set_mod(mod: string, enabled: boolean): void;
  set_gametype(gametypeId: string): void;
  set_mad_house(variant: number): void;
  end_round(): void;
  end_match(): void;
};

export type UpdateComponent = { name: string; current: string; target: string };

export type UpdateSnapshot = {
  busy: boolean;
  checking: boolean;
  components: UpdateComponent[];
};

type UpdateObject = {
  snapshot(callback: (snapshot: UpdateSnapshot) => void): void;
  check(): void;
  apply(index: number): void;
};

export type Bridge = {
  platform: PlatformBridge;
  library: LibraryBridge;
  info: InfoBridge;
  settings: SettingsBridge;
  downloader: DownloaderObject;
  radmin: RadminObject;
  liberator: LiberatorObject;
  launch: LaunchObject;
  shears: ShearsObject;
  uninstall: UninstallObject;
  update: UpdateObject;
};

declare global {
  interface Window {
    throwback?: Bridge;
  }
}

export function onBridgeReady(callback: (bridge: Bridge) => void): void {
  if (typeof window === "undefined") return;
  if (window.throwback) {
    callback(window.throwback);
    return;
  }
  window.addEventListener(
    "throwback:ready",
    () => {
      if (window.throwback) callback(window.throwback);
    },
    { once: true },
  );
}

export function usePlatform(): ThrowbackOS | null {
  const [os, setOs] = useState<ThrowbackOS | null>(null);
  useEffect(() => {
    onBridgeReady((bridge) => setOs(bridge.platform.os));
  }, []);
  return os;
}

export function useSeasons(): Season[] | null {
  const [seasons, setSeasons] = useState<Season[] | null>(null);
  useEffect(() => {
    onBridgeReady((bridge) => setSeasons(bridge.library.seasons));
  }, []);
  return seasons;
}

export function useHomeSeasons(): Season[] | null {
  const [seasons, setSeasons] = useState<Season[] | null>(null);
  useEffect(() => {
    onBridgeReady((bridge) => bridge.library.home(setSeasons));
  }, []);
  return seasons;
}

export function useInfo(): InfoSnapshot | null {
  const [info, setInfo] = useState<InfoSnapshot | null>(null);
  useEffect(() => {
    onBridgeReady((bridge) => bridge.info.snapshot(setInfo));
  }, []);
  return info;
}

export function useSettings(): SettingsBridge | null {
  const [settings, setSettings] = useState<SettingsBridge | null>(null);
  const [, bump] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    let connected: SettingsBridge | null = null;
    onBridgeReady((bridge) => {
      connected = bridge.settings;
      setSettings(connected);
      connected.username_changed.connect(bump);
      connected.steam_account_changed.connect(bump);
      connected.max_downloads_changed.connect(bump);
      connected.discord_rpc_changed.connect(bump);
      connected.rpc_config_changed.connect(bump);
    });
    return () => {
      if (!connected) return;
      connected.username_changed.disconnect(bump);
      connected.steam_account_changed.disconnect(bump);
      connected.max_downloads_changed.disconnect(bump);
      connected.discord_rpc_changed.disconnect(bump);
      connected.rpc_config_changed.disconnect(bump);
    };
  }, []);

  return settings;
}

export type DownloaderEvents = {
  onLog?: (line: string) => void;
  onLogin?: (kind: string) => void;
  onFinished?: (code: number) => void;
  onError?: (message: string) => void;
  onSteamSetupDone?: (ok: boolean, message: string) => void;
};

export type Downloader = DownloaderSnapshot & {
  ready: boolean;
  start: (key: string, enableHm: boolean) => void;
  verify: (key: string, isHm: boolean) => void;
  cancel: () => void;
  submitLogin: (text: string) => void;
  submitAccountLogin: (account: string, password: string) => void;
  loadHistory: (callback: (history: string) => void) => void;
  isSteamRunning: (callback: (running: boolean) => void) => void;
  protonOptions: (callback: (protons: ProtonOption[]) => void) => void;
  steamSetup: (key: string, index: number) => void;
};

export function useDownloader(events?: DownloaderEvents): Downloader {
  const [snap, setSnap] = useState<DownloaderSnapshot>({
    state: "idle",
    progress: 0,
    running: false,
    activeKey: "",
  });
  const [ready, setReady] = useState(false);
  const objRef = useRef<DownloaderObject | null>(null);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  });

  useEffect(() => {
    let mounted = true;

    onBridgeReady((bridge) => {
      if (!mounted) return;
      objRef.current = bridge.downloader;
      setReady(true);
      bridge.downloader.snapshot((snapshot) => {
        if (mounted) setSnap(snapshot);
      });
    });

    function onEvent(raw: Event) {
      const detail = (raw as CustomEvent).detail as {
        target: string;
        event: string;
        args: unknown[];
      };
      if (detail.target !== "downloader") return;
      const value = detail.args[0];
      switch (detail.event) {
        case "state":
          setSnap((prev) => ({ ...prev, state: value as string }));
          break;
        case "progress":
          setSnap((prev) => ({ ...prev, progress: value as number }));
          break;
        case "running":
          setSnap((prev) => ({ ...prev, running: value as boolean }));
          break;
        case "active_key":
          setSnap((prev) => ({ ...prev, activeKey: value as string }));
          break;
        case "log_line":
          eventsRef.current?.onLog?.(value as string);
          break;
        case "login_required":
          eventsRef.current?.onLogin?.(value as string);
          break;
        case "finished":
          eventsRef.current?.onFinished?.(value as number);
          break;
        case "error":
          eventsRef.current?.onError?.(value as string);
          break;
        case "steam_setup_done":
          eventsRef.current?.onSteamSetupDone?.(
            detail.args[0] as boolean,
            detail.args[1] as string,
          );
          break;
      }
    }

    window.addEventListener("throwback:event", onEvent);
    return () => {
      mounted = false;
      window.removeEventListener("throwback:event", onEvent);
    };
  }, []);

  return {
    ...snap,
    ready,
    start: (key, enableHm) => objRef.current?.start(key, enableHm),
    verify: (key, isHm) => objRef.current?.verify(key, isHm),
    cancel: () => objRef.current?.cancel(),
    submitLogin: (text) => objRef.current?.submit_login(text),
    submitAccountLogin: (account, password) =>
      objRef.current?.submit_account_login(account, password),
    loadHistory: (callback) => objRef.current?.log_history(callback),
    isSteamRunning: (callback) => objRef.current?.is_steam_running(callback),
    protonOptions: (callback) => objRef.current?.proton_options(callback),
    steamSetup: (key, index) => objRef.current?.steam_setup(key, index),
  };
}

export type RadminEvents = {
  onResult?: (ok: boolean, message: string) => void;
};

export type Radmin = RadminSnapshot & {
  ready: boolean;
  refresh: () => void;
  setRadminIp: (ip: string, callback: (ok: boolean) => void) => void;
  createBridge: (ip: string) => void;
  removeBridge: () => void;
  attach: (vm: string) => void;
  listVms: (callback: (vms: string[]) => void) => void;
};

const RADMIN_DEFAULT: RadminSnapshot = {
  vboxInstalled: false,
  radminIp: "",
  iface: "",
  bridgePresent: false,
  bridgeReady: false,
  competingRoute: "",
  busy: false,
};

export function useRadmin(events?: RadminEvents): Radmin {
  const [snap, setSnap] = useState<RadminSnapshot>(RADMIN_DEFAULT);
  const [ready, setReady] = useState(false);
  const objRef = useRef<RadminObject | null>(null);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  });

  useEffect(() => {
    let mounted = true;

    function refresh() {
      objRef.current?.snapshot((snapshot) => {
        if (mounted) setSnap(snapshot);
      });
    }

    onBridgeReady((bridge) => {
      if (!mounted) return;
      objRef.current = bridge.radmin;
      setReady(true);
      refresh();
    });

    function onEvent(raw: Event) {
      const detail = (raw as CustomEvent).detail as {
        target: string;
        event: string;
        args: unknown[];
      };
      if (detail.target !== "radmin") return;
      if (detail.event === "result") {
        eventsRef.current?.onResult?.(
          detail.args[0] as boolean,
          detail.args[1] as string,
        );
      }
      refresh();
    }

    window.addEventListener("throwback:event", onEvent);
    return () => {
      mounted = false;
      window.removeEventListener("throwback:event", onEvent);
    };
  }, []);

  return {
    ...snap,
    ready,
    refresh: () => objRef.current?.snapshot((snapshot) => setSnap(snapshot)),
    setRadminIp: (ip, callback) => objRef.current?.set_radmin_ip(ip, callback),
    createBridge: (ip) => objRef.current?.create_bridge(ip),
    removeBridge: () => objRef.current?.remove_bridge(),
    attach: (vm) => objRef.current?.attach(vm),
    listVms: (callback) => objRef.current?.vms(callback),
  };
}

const NO_CAPABILITIES: LiberatorCapabilities = {
  godMode: false,
  disableAI: false,
  unlimitedAmmo: false,
  unlimitedEquip: false,
  infiniteTime: false,
  disablePrimary: false,
  disableSecondary: false,
  disableSpecialGadget: false,
  disableGadget: false,
  harvard: false,
  oldHereford: false,
  displayBuild: false,
  madHouse: false,
  endRound: false,
  endMatch: false,
  playlist: false,
  unlockAll: false,
};

const LIBERATOR_DEFAULT: LiberatorState = {
  attached: false,
  seasonName: "",
  buildNumber: "",
  tier: "",
  ready: false,
  status: "",
  capabilities: NO_CAPABILITIES,
  madHouseVariants: [],
};

export type LiberatorEvents = { onError?: (message: string) => void };

export type Liberator = LiberatorState & {
  tree: GametypeNode | null;
  setMod: (mod: string, enabled: boolean) => void;
  setGametype: (id: string) => void;
  setMadHouse: (variant: number) => void;
  endRound: () => void;
  endMatch: () => void;
  isGameRunning: (callback: (running: boolean) => void) => void;
};

export function useLiberator(events?: LiberatorEvents): Liberator {
  const [state, setState] = useState<LiberatorState>(LIBERATOR_DEFAULT);
  const [tree, setTree] = useState<GametypeNode | null>(null);
  const objRef = useRef<LiberatorObject | null>(null);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  });

  useEffect(() => {
    let mounted = true;

    onBridgeReady((bridge) => {
      if (!mounted) return;
      objRef.current = bridge.liberator;
      bridge.liberator?.snapshot((snapshot) => {
        if (mounted) setState(snapshot);
      });
      bridge.liberator?.tree_snapshot((tree) => {
        if (mounted) setTree(tree);
      });
    });

    function onEvent(raw: Event) {
      const detail = (raw as CustomEvent).detail as {
        target: string;
        event: string;
        args: unknown[];
      };
      if (detail.target !== "liberator") return;
      if (detail.event === "state") {
        setState(detail.args[0] as LiberatorState);
      } else if (detail.event === "tree") {
        setTree(detail.args[0] as GametypeNode);
      } else if (detail.event === "error") {
        eventsRef.current?.onError?.(detail.args[0] as string);
      }
    }

    window.addEventListener("throwback:event", onEvent);
    return () => {
      mounted = false;
      window.removeEventListener("throwback:event", onEvent);
    };
  }, []);

  return {
    ...state,
    tree,
    setMod: (mod, enabled) => objRef.current?.set_mod(mod, enabled),
    setGametype: (id) => objRef.current?.set_gametype(id),
    setMadHouse: (variant) => objRef.current?.set_mad_house(variant),
    endRound: () => objRef.current?.end_round(),
    endMatch: () => objRef.current?.end_match(),
    isGameRunning: (callback) => objRef.current?.is_game_running(callback),
  };
}

export type Launch = {
  ready: boolean;
  status: (key: string, callback: (status: LaunchStatus) => void) => void;
  launch: (key: string) => void;
};

export function useLaunch(): Launch {
  const [ready, setReady] = useState(false);
  const objRef = useRef<LaunchObject | null>(null);

  useEffect(() => {
    onBridgeReady((bridge) => {
      objRef.current = bridge.launch;
      setReady(true);
    });
  }, []);

  return useMemo(
    () => ({
      ready,
      status: (key, callback) => objRef.current?.status(key, callback),
      launch: (key) => objRef.current?.launch(key),
    }),
    [ready],
  );
}

export type Shears = {
  ready: boolean;
  scan: (key: string, callback: (scan: ShearsScan) => void) => void;
  cut: (
    key: string,
    kind: ShearsKind,
    level: number,
    callback: (result: ShearsCutResult) => void,
  ) => void;
};

export function useShears(): Shears {
  const [ready, setReady] = useState(false);
  const objRef = useRef<ShearsObject | null>(null);

  useEffect(() => {
    onBridgeReady((bridge) => {
      objRef.current = bridge.shears;
      setReady(true);
    });
  }, []);

  return useMemo(
    () => ({
      ready,
      scan: (key, callback) => objRef.current?.scan(key, callback),
      cut: (key, kind, level, callback) =>
        objRef.current?.cut(key, kind, level, callback),
    }),
    [ready],
  );
}

export type UninstallEvents = {
  onFinished?: (ok: boolean, message: string) => void;
};

export type Uninstall = {
  ready: boolean;
  preview: (
    key: string,
    callback: (targets: UninstallTargets) => void,
  ) => void;
  run: (key: string) => void;
};

export function useUninstall(events?: UninstallEvents): Uninstall {
  const [ready, setReady] = useState(false);
  const objRef = useRef<UninstallObject | null>(null);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  });

  useEffect(() => {
    onBridgeReady((bridge) => {
      objRef.current = bridge.uninstall;
      setReady(true);
    });

    function onEvent(raw: Event) {
      const detail = (raw as CustomEvent).detail as {
        target: string;
        event: string;
        args: unknown[];
      };
      if (detail.target !== "uninstall") return;
      if (detail.event === "finished") {
        eventsRef.current?.onFinished?.(
          detail.args[0] as boolean,
          detail.args[1] as string,
        );
      }
    }

    window.addEventListener("throwback:event", onEvent);
    return () => window.removeEventListener("throwback:event", onEvent);
  }, []);

  return useMemo(
    () => ({
      ready,
      preview: (key, callback) => objRef.current?.preview(key, callback),
      run: (key) => objRef.current?.run(key),
    }),
    [ready],
  );
}

export type UpdateEvents = {
  onLog?: (line: string) => void;
  onFinished?: (ok: boolean, name: string) => void;
};

export type Update = UpdateSnapshot & {
  ready: boolean;
  check: () => void;
  apply: (index: number) => void;
};

const UPDATE_DEFAULT: UpdateSnapshot = {
  busy: false,
  checking: false,
  components: [],
};

export function useUpdate(events?: UpdateEvents): Update {
  const [snap, setSnap] = useState<UpdateSnapshot>(UPDATE_DEFAULT);
  const [ready, setReady] = useState(false);
  const objRef = useRef<UpdateObject | null>(null);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  });

  useEffect(() => {
    let mounted = true;

    function refresh() {
      objRef.current?.snapshot((snapshot) => {
        if (mounted) setSnap(snapshot);
      });
    }

    onBridgeReady((bridge) => {
      if (!mounted) return;
      objRef.current = bridge.update;
      setReady(true);
      refresh();
      bridge.update.check();
    });

    function onEvent(raw: Event) {
      const detail = (raw as CustomEvent).detail as {
        target: string;
        event: string;
        args: unknown[];
      };
      if (detail.target !== "update") return;
      if (detail.event === "log_line") {
        eventsRef.current?.onLog?.(detail.args[0] as string);
      } else if (detail.event === "finished") {
        eventsRef.current?.onFinished?.(
          detail.args[0] as boolean,
          detail.args[1] as string,
        );
      } else {
        refresh();
      }
    }

    window.addEventListener("throwback:event", onEvent);
    return () => {
      mounted = false;
      window.removeEventListener("throwback:event", onEvent);
    };
  }, []);

  return {
    ...snap,
    ready,
    check: () => objRef.current?.check(),
    apply: (index) => objRef.current?.apply(index),
  };
}
