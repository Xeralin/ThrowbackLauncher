"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

export type ThrowbackOS = "linux" | "windows" | "macos";

export type Season = {
  key: string;
  code: string;
  name: string;
  label: string;
  sizeGb: number;
  liberator: boolean;
  heatedMetal: boolean;
  hmBeta: boolean;
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
  diskUsageGb: number;
  version: string;
};

type InfoBridge = {
  snapshot(callback: (info: InfoSnapshot) => void): void;
  open_library(path: string): void;
};

export type LaunchStatus = {
  installed: boolean;
  hm: boolean;
  partial: boolean;
  steamLinked: boolean;
};

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
  scan(key: string): void;
  cut(key: string, kind: ShearsKind, level: number): void;
};

export type UninstallTargets = {
  folder: string;
  prefix: string;
  shortcut: boolean;
};

type UninstallObject = {
  preview(key: string, callback: (targets: UninstallTargets) => void): void;
  run(key: string): void;
  run_item(key: string, item: string): void;
};

export type LibraryEntry = {
  path: string;
  default: boolean;
  exists: boolean;
  seasons: number;
  freeGb: number | null;
};

export type SettingsBridge = {
  username: string;
  steam_account: string;
  max_downloads: number;
  discord_rpc: boolean;
  rpc_config: Record<string, string>;
  home_order: string[];
  home_sizes: Record<string, string>;
  liberator_enabled: boolean;
  download_bounds: { min: number; max: number };
  libraries(callback: (libraries: LibraryEntry[]) => void): void;
  set_username(value: string): void;
  set_max_downloads(value: number): void;
  set_discord_rpc(value: boolean): void;
  set_rpc_field(key: string, value: string): void;
  set_home_order(order: string[]): void;
  set_home_size(key: string, width: number, height: number): void;
  set_liberator_enabled(value: boolean): void;
  add_library(): void;
  remove_library(path: string): void;
  set_default_library(path: string): void;
  logout(): void;
  clear_cache(): void;
  username_changed: QtSignal;
  steam_account_changed: QtSignal;
  max_downloads_changed: QtSignal;
  discord_rpc_changed: QtSignal;
  rpc_config_changed: QtSignal;
  home_order_changed: QtSignal;
  home_sizes_changed: QtSignal;
  liberator_enabled_changed: QtSignal;
  invalid_setting: QtSignal;
  logged_out: QtSignal;
  cache_cleared: QtSignal;
  libraries_changed: QtSignal;
};

type DownloaderSnapshot = {
  state: string;
  progress: number;
  running: boolean;
  activeKey: string;
  login: string;
  queue: string[];
};

export type ProtonOption = { index: number; display: string };

type DownloaderObject = {
  start(key: string, enableHm: boolean, library: string): void;
  enqueue(key: string, enableHm: boolean, library: string): void;
  dequeue(key: string): void;
  verify(key: string): void;
  delete_partial(key: string): void;
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
  bridgePresent: boolean;
  bridgeReady: boolean;
  competingRoute: string;
  busy: boolean;
};

type RadminObject = {
  refresh(): void;
  vms(): void;
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
};

export type LiberatorState = {
  attached: boolean;
  tier: "fullMods" | "unlockAll" | "";
  status: string;
  capabilities: LiberatorCapabilities;
  madHouseVariants: string[];
};

export type GametypeNode = {
  text: string;
  id: string;
  children: GametypeNode[];
};

type LiberatorObject = {
  snapshot(callback: (state: LiberatorState) => void): void;
  tree_snapshot(callback: (tree: GametypeNode | null) => void): void;
  set_mod(mod: string, enabled: boolean): void;
  set_gametype(gametypeId: string): void;
  set_mad_house(variant: number): void;
  end_round(): void;
  end_match(): void;
};

export type UpdateComponent = {
  name: string;
  current: string;
  target: string;
  notes: string[];
};

export type UpdateSnapshot = {
  busy: boolean;
  checking: boolean;
  components: UpdateComponent[];
  checkError: string;
};

type UpdateObject = {
  snapshot(callback: (snapshot: UpdateSnapshot) => void): void;
  check(force?: boolean): void;
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

export function onBridgeEvent(
  target: string,
  handler: (event: string, args: unknown[]) => void,
): () => void {
  function listener(raw: Event) {
    const detail = (raw as CustomEvent).detail as {
      target: string;
      event: string;
      args: unknown[];
    };
    if (detail.target === target) handler(detail.event, detail.args);
  }
  window.addEventListener("throwback:event", listener);
  return () => window.removeEventListener("throwback:event", listener);
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

export function useHomeSeasons(): [Season[] | null, () => void] {
  const [seasons, setSeasons] = useState<Season[] | null>(null);
  const refresh = useCallback(() => {
    onBridgeReady((bridge) => bridge.library.home(setSeasons));
  }, []);
  useEffect(refresh, [refresh]);
  return [seasons, refresh];
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
    let cancelled = false;
    let connected: SettingsBridge | null = null;
    onBridgeReady((bridge) => {
      if (cancelled) return;
      connected = bridge.settings;
      setSettings(connected);
      connected.username_changed.connect(bump);
      connected.steam_account_changed.connect(bump);
      connected.max_downloads_changed.connect(bump);
      connected.discord_rpc_changed.connect(bump);
      connected.rpc_config_changed.connect(bump);
      connected.home_order_changed.connect(bump);
      connected.home_sizes_changed.connect(bump);
      connected.liberator_enabled_changed.connect(bump);
    });
    return () => {
      cancelled = true;
      if (!connected) return;
      connected.username_changed.disconnect(bump);
      connected.steam_account_changed.disconnect(bump);
      connected.max_downloads_changed.disconnect(bump);
      connected.discord_rpc_changed.disconnect(bump);
      connected.rpc_config_changed.disconnect(bump);
      connected.home_order_changed.disconnect(bump);
      connected.home_sizes_changed.disconnect(bump);
      connected.liberator_enabled_changed.disconnect(bump);
    };
  }, []);

  return settings;
}

export function useLibraries(): [LibraryEntry[] | null, () => void] {
  const [libraries, setLibraries] = useState<LibraryEntry[] | null>(null);
  const refresh = useCallback(() => {
    onBridgeReady((bridge) => bridge.settings.libraries(setLibraries));
  }, []);

  useEffect(() => {
    refresh();
    let cancelled = false;
    let connected: SettingsBridge | null = null;
    onBridgeReady((bridge) => {
      if (cancelled) return;
      connected = bridge.settings;
      connected.libraries_changed.connect(refresh);
    });
    return () => {
      cancelled = true;
      connected?.libraries_changed.disconnect(refresh);
    };
  }, [refresh]);

  return [libraries, refresh];
}

export type DownloaderEvents = {
  onLog?: (line: string) => void;
  onLogin?: (kind: string) => void;
  onFinished?: (code: number) => void;
  onError?: (message: string) => void;
  onSteamSetupDone?: (ok: boolean, message: string) => void;
  onPartialDeleted?: (key: string, ok: boolean, message: string) => void;
};

export type Downloader = DownloaderSnapshot & {
  ready: boolean;
  start: (key: string, enableHm: boolean, library: string) => void;
  enqueue: (key: string, enableHm: boolean, library: string) => void;
  dequeue: (key: string) => void;
  verify: (key: string) => void;
  deletePartial: (key: string) => void;
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
    login: "",
    queue: [],
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

    const offEvent = onBridgeEvent("downloader", (event, args) => {
      const value = args[0];
      switch (event) {
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
        case "queue":
          setSnap((prev) => ({ ...prev, queue: value as string[] }));
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
            args[0] as boolean,
            args[1] as string,
          );
          break;
        case "partial_deleted":
          eventsRef.current?.onPartialDeleted?.(
            args[0] as string,
            args[1] as boolean,
            args[2] as string,
          );
          break;
      }
    });
    return () => {
      mounted = false;
      offEvent();
    };
  }, []);

  return useMemo(
    () => ({
      ...snap,
      ready,
      start: (key, enableHm, library) =>
        objRef.current?.start(key, enableHm, library),
      enqueue: (key, enableHm, library) =>
        objRef.current?.enqueue(key, enableHm, library),
      dequeue: (key) => objRef.current?.dequeue(key),
      verify: (key) => objRef.current?.verify(key),
      deletePartial: (key) => objRef.current?.delete_partial(key),
      cancel: () => objRef.current?.cancel(),
      submitLogin: (text) => objRef.current?.submit_login(text),
      submitAccountLogin: (account, password) =>
        objRef.current?.submit_account_login(account, password),
      loadHistory: (callback) => objRef.current?.log_history(callback),
      isSteamRunning: (callback) => objRef.current?.is_steam_running(callback),
      protonOptions: (callback) => objRef.current?.proton_options(callback),
      steamSetup: (key, index) => objRef.current?.steam_setup(key, index),
    }),
    [snap, ready],
  );
}

export type RadminEvents = {
  onResult?: (ok: boolean, message: string) => void;
};

export type Radmin = RadminSnapshot & {
  ready: boolean;
  createBridge: (ip: string) => void;
  removeBridge: () => void;
  attach: (vm: string) => void;
  listVms: (callback: (vms: string[]) => void) => void;
};

const RADMIN_DEFAULT: RadminSnapshot = {
  vboxInstalled: false,
  radminIp: "",
  bridgePresent: false,
  bridgeReady: false,
  competingRoute: "",
  busy: false,
};

export function useRadmin(events?: RadminEvents): Radmin {
  const [snap, setSnap] = useState<RadminSnapshot>(RADMIN_DEFAULT);
  const [ready, setReady] = useState(false);
  const objRef = useRef<RadminObject | null>(null);
  const vmsCallback = useRef<((vms: string[]) => void) | null>(null);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  });

  useEffect(() => {
    let mounted = true;

    onBridgeReady((bridge) => {
      if (!mounted) return;
      objRef.current = bridge.radmin;
      setReady(true);
      bridge.radmin.refresh();
    });

    const offEvent = onBridgeEvent("radmin", (event, args) => {
      if (event === "state") {
        if (mounted) setSnap(args[0] as RadminSnapshot);
        return;
      }
      if (event === "vms") {
        vmsCallback.current?.(args[0] as string[]);
        vmsCallback.current = null;
        return;
      }
      if (event === "result") {
        eventsRef.current?.onResult?.(args[0] as boolean, args[1] as string);
      }
      objRef.current?.refresh();
    });
    return () => {
      mounted = false;
      offEvent();
    };
  }, []);

  return useMemo(
    () => ({
      ...snap,
      ready,
      createBridge: (ip) => objRef.current?.create_bridge(ip),
      removeBridge: () => objRef.current?.remove_bridge(),
      attach: (vm) => objRef.current?.attach(vm),
      listVms: (callback) => {
        vmsCallback.current = callback;
        objRef.current?.vms();
      },
    }),
    [snap, ready],
  );
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
};

const LIBERATOR_DEFAULT: LiberatorState = {
  attached: false,
  tier: "",
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
      bridge.liberator.snapshot((snapshot) => {
        if (mounted) setState(snapshot);
      });
      bridge.liberator.tree_snapshot((tree) => {
        if (mounted) setTree(tree);
      });
    });

    const offEvent = onBridgeEvent("liberator", (event, args) => {
      if (event === "state") {
        setState(args[0] as LiberatorState);
      } else if (event === "tree") {
        setTree(args[0] as GametypeNode);
      } else if (event === "error") {
        eventsRef.current?.onError?.(args[0] as string);
      }
    });
    return () => {
      mounted = false;
      offEvent();
    };
  }, []);

  return useMemo(
    () => ({
      ...state,
      tree,
      setMod: (mod, enabled) => objRef.current?.set_mod(mod, enabled),
      setGametype: (id) => objRef.current?.set_gametype(id),
      setMadHouse: (variant) => objRef.current?.set_mad_house(variant),
      endRound: () => objRef.current?.end_round(),
      endMatch: () => objRef.current?.end_match(),
    }),
    [state, tree],
  );
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
  const scanCallback = useRef<((scan: ShearsScan) => void) | null>(null);
  const cutCallback = useRef<((result: ShearsCutResult) => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    onBridgeReady((bridge) => {
      if (!mounted) return;
      objRef.current = bridge.shears;
      setReady(true);
    });

    const offEvent = onBridgeEvent("shears", (event, args) => {
      if (event === "scan") {
        scanCallback.current?.(args[0] as ShearsScan);
      } else if (event === "cut") {
        cutCallback.current?.(args[0] as ShearsCutResult);
      }
    });
    return () => {
      mounted = false;
      offEvent();
    };
  }, []);

  return useMemo(
    () => ({
      ready,
      scan: (key, callback) => {
        scanCallback.current = callback;
        objRef.current?.scan(key);
      },
      cut: (key, kind, level, callback) => {
        cutCallback.current = callback;
        objRef.current?.cut(key, kind, level);
      },
    }),
    [ready],
  );
}

export type UninstallEvents = {
  onFinished?: (ok: boolean, message: string) => void;
  onItemFinished?: (item: string, ok: boolean, message: string) => void;
};

export type Uninstall = {
  ready: boolean;
  preview: (key: string, callback: (targets: UninstallTargets) => void) => void;
  run: (key: string) => void;
  runItem: (key: string, item: string) => void;
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

    const offEvent = onBridgeEvent("uninstall", (event, args) => {
      if (event === "finished") {
        eventsRef.current?.onFinished?.(args[0] as boolean, args[1] as string);
      } else if (event === "item_finished") {
        eventsRef.current?.onItemFinished?.(
          args[0] as string,
          args[1] as boolean,
          args[2] as string,
        );
      }
    });
    return offEvent;
  }, []);

  return useMemo(
    () => ({
      ready,
      preview: (key, callback) => objRef.current?.preview(key, callback),
      run: (key) => objRef.current?.run(key),
      runItem: (key, item) => objRef.current?.run_item(key, item),
    }),
    [ready],
  );
}

export type UpdateEvents = {
  onLog?: (line: string) => void;
  onFinished?: (ok: boolean, name: string) => void;
};

export type Update = UpdateSnapshot & {
  check: (force?: boolean) => void;
  apply: (index: number) => void;
};

const UPDATE_DEFAULT: UpdateSnapshot = {
  busy: false,
  checking: false,
  components: [],
  checkError: "",
};

export function useUpdate(events?: UpdateEvents): Update {
  const [snap, setSnap] = useState<UpdateSnapshot>(UPDATE_DEFAULT);
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
      refresh();
      bridge.update.check(false);
    });

    const offEvent = onBridgeEvent("update", (event, args) => {
      if (event === "log_line") {
        eventsRef.current?.onLog?.(args[0] as string);
      } else if (event === "finished") {
        eventsRef.current?.onFinished?.(args[0] as boolean, args[1] as string);
      } else {
        refresh();
      }
    });
    return () => {
      mounted = false;
      offEvent();
    };
  }, []);

  return useMemo(
    () => ({
      ...snap,
      check: (force = false) => objRef.current?.check(force),
      apply: (index) => objRef.current?.apply(index),
    }),
    [snap],
  );
}
