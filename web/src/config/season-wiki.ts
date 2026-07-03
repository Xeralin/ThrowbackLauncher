export type WikiOperator = {
  name: string;
  side: "attacker" | "defender";
  ctu: string;
  gadget: string;
};

export type WikiMap = {
  name: string;
  kind: "new" | "rework";
};

export type SeasonWikiEntry = {
  release: string;
  summary: string;
  operators: WikiOperator[];
  maps: WikiMap[];
  highlights: string[];
};

export const SEASON_WIKI: Record<string, SeasonWikiEntry> = {
  Y1S0_Vanilla: {
    release: "December 1, 2015",
    summary:
      "Rainbow Six Siege launches December 1, 2015 with 20 operators from five CTUs (SAS, FBI SWAT, GIGN, Spetsnaz, GSG 9) and 10 multiplayer maps, built around destructible environments and 5v5 attack-versus-defense siege gameplay.",
    operators: [],
    maps: [],
    highlights: [
      "RealBlast procedural destruction of walls, floors and ceilings",
      "Situations: 10 solo and 1 co-op tutorial missions",
      "Terrorist Hunt co-op mode against AI enemies",
      "5v5 attacker vs defender rounds with bomb, hostage and secure area",
    ],
  },
  Y1S1_BlackIce: {
    release: "February 2, 2016",
    summary:
      "Operation Black Ice is Siege's first post-launch season, set around the Canadian Arctic. It adds JTF2 operators Buck and Frost, the free Yacht map, and a spectator camera on all platforms.",
    operators: [
      {
        name: "Buck",
        side: "attacker",
        ctu: "JTF2",
        gadget: "Skeleton Key under-barrel shotgun",
      },
      {
        name: "Frost",
        side: "defender",
        ctu: "JTF2",
        gadget: "Welcome Mat leg traps",
      },
    ],
    maps: [{ name: "Yacht", kind: "new" }],
    highlights: [
      "First post-launch season, establishes free-map DLC model",
      "Spectator camera added on all platforms",
      "Introduces seasonal Black Ice weapon skins",
    ],
  },
  Y1S2_DustLine: {
    release: "May 10, 2016",
    summary:
      "Year 1 Season 2 adds Navy SEAL operators Blackbeard and Valkyrie and the free Border map. The update also introduces between-round loadout changes plus weapon charm, skin and headgear customization.",
    operators: [
      {
        name: "Blackbeard",
        side: "attacker",
        ctu: "Navy SEALs",
        gadget: "TARS rifle-mounted transparent shield",
      },
      {
        name: "Valkyrie",
        side: "defender",
        ctu: "Navy SEALs",
        gadget: "Black Eye throwable sticky cameras",
      },
    ],
    maps: [{ name: "Border", kind: "new" }],
    highlights: [
      "Loadouts can be changed between rounds",
      "Weapon charms, skins and operator headgear customization",
      "New weapons: MPX, SPAS-12, Mk17 CQB, SR-25 and D-50",
    ],
  },
  Y1S3_SkullRain: {
    release: "August 2, 2016",
    summary:
      "Year 1 Season 3 heads to Brazil, adding BOPE operators Capitão and Caveira plus the free Favela map. Patch 4.0 also brings BattlEye anti-cheat, the angled grip, a surrender vote, and the Tactical Realism custom mode.",
    operators: [
      {
        name: "Capitão",
        side: "attacker",
        ctu: "BOPE",
        gadget: "Crossbow: asphyxiating bolts, micro smokes",
      },
      {
        name: "Caveira",
        side: "defender",
        ctu: "BOPE",
        gadget: "Silent Step stealth and interrogation",
      },
    ],
    maps: [{ name: "Favela", kind: "new" }],
    highlights: [
      "BattlEye anti-cheat added alongside FairFight",
      "Angled grip attachment for faster ADS transitions",
      "Surrender vote system for Ranked matches",
      "Tactical Realism custom game mode with minimal HUD",
    ],
  },
  Y1S4_RedCrow: {
    release: "November 17, 2016",
    summary:
      "Operation Red Crow is Year 1 Season 4 of Rainbow Six Siege, themed around Japan. It adds SAT operators Hibana and Echo, the free Skyscraper map set in Nagoya, and caliber-based destruction physics.",
    operators: [
      {
        name: "Hibana",
        side: "attacker",
        ctu: "SAT",
        gadget: "X-KAIROS explosive breaching pellets",
      },
      {
        name: "Echo",
        side: "defender",
        ctu: "SAT",
        gadget: "Yokai drone with disorienting sonic bursts",
      },
    ],
    maps: [{ name: "Skyscraper", kind: "new" }],
    highlights: [
      "Free Skyscraper map: a Yakuza mansion high above Nagoya, Japan",
      "Caliber-based destruction scales bullet holes by weapon caliber",
      "Hibana's X-KAIROS launcher breaches reinforced walls from range",
      "Echo's Yokai drone clings to ceilings and fires ultrasonic bursts",
    ],
  },
  Y2S1_VelvetShell: {
    release: "February 7, 2017",
    summary:
      "Velvet Shell opens Year 2 with a Spanish theme, adding GEO operators Jackal and Mira and the free Coastline map set in Ibiza. Jackal tracks enemy footprints while Mira deploys one-way Black Mirror windows on walls.",
    operators: [
      {
        name: "Jackal",
        side: "attacker",
        ctu: "GEO",
        gadget: "Eyenox footprint-tracking visor",
      },
      {
        name: "Mira",
        side: "defender",
        ctu: "GEO",
        gadget: "Black Mirror one-way glass windows",
      },
    ],
    maps: [{ name: "Coastline", kind: "new" }],
    highlights: [
      "Kicks off Year 2 with Spanish GEO operators Jackal and Mira",
      "Mira's Black Mirror puts one-way windows in reinforced or soft walls",
      "Jackal's Eyenox visor tracks enemy footprints in real time",
      "New weapons: C7E, PDW9, and Vector .45 ACP",
    ],
  },
  Y2S2_Health: {
    release: "June 7, 2017",
    summary:
      "Operation Health is Year 2 Season 2, a maintenance season with no new operators or maps. It focuses on technical fixes: one-step matchmaking, improved hit registration, redesigned hitboxes, and server infrastructure upgrades.",
    operators: [],
    maps: [],
    highlights: [
      "One-step matchmaking with faster queue flow",
      "Server tick rate raised from 50 to 60, improving hit registration",
      "Hitbox redesign limited to the operator body",
      "No new content; Hong Kong season delayed, Polish map cancelled",
    ],
  },
  Y2S3_BloodOrchid: {
    release: "September 5, 2017",
    summary:
      "Hong Kong-themed Year 2 Season 3 adds SDU operators Ying and Lesion, GROM defender Ela, and the Theme Park map, alongside the game's biggest patch to date with sweeping texture and lighting improvements.",
    operators: [
      {
        name: "Ying",
        side: "attacker",
        ctu: "SDU",
        gadget: "Candela cluster flash charges",
      },
      {
        name: "Lesion",
        side: "defender",
        ctu: "SDU",
        gadget: "Gu mines with slowing toxin",
      },
      {
        name: "Ela",
        side: "defender",
        ctu: "GROM",
        gadget: "Grzmot concussion mines",
      },
    ],
    maps: [{ name: "Theme Park", kind: "new" }],
    highlights: [
      "Three operators in one season after the Poland season was merged in",
      "Biggest patch to date with texture, lighting and sky dome overhaul",
      "Extensive weapon, gadget and operator balance tweaks",
    ],
  },
  Y2S4_WhiteNoise: {
    release: "December 5, 2017",
    summary:
      "Year 2 Season 4 is set in Seoul, South Korea. It adds 707th SMB operators Dokkaebi and Vigil, Polish GROM attacker Zofia, and the free Tower map atop Mok Myeok Tower.",
    operators: [
      {
        name: "Dokkaebi",
        side: "attacker",
        ctu: "707th SMB",
        gadget: "Logic Bomb hacks defender phones",
      },
      {
        name: "Vigil",
        side: "defender",
        ctu: "707th SMB",
        gadget: "ERC-7 hides him from drone/camera feeds",
      },
      {
        name: "Zofia",
        side: "attacker",
        ctu: "GROM",
        gadget: "KS79 Lifeline impact/concussion launcher",
      },
    ],
    maps: [{ name: "Tower", kind: "new" }],
    highlights: [
      "Three operators: Dokkaebi and Vigil (707th SMB) plus GROM's Zofia",
      "Free Tower map set atop Mok Myeok Tower in Seoul",
      "Zofia's Withstand lets her self-revive from a downed state",
      "Dokkaebi can hack dead defenders' phones to access their cameras",
    ],
  },
  Y3S1_Chimera: {
    release: "March 6, 2018",
    summary:
      "Year 3 Season 1 adds CBRN attackers Lion and Finka and runs Outbreak, a limited-time three-player PvE co-op event set in Truth or Consequences, New Mexico. No new PvP map ships with the season.",
    operators: [
      {
        name: "Lion",
        side: "attacker",
        ctu: "CBRN Threat Unit",
        gadget: "EE-ONE-D drone map-wide motion scan",
      },
      {
        name: "Finka",
        side: "attacker",
        ctu: "CBRN Threat Unit",
        gadget: "Adrenal Surge team health and revive boost",
      },
    ],
    maps: [],
    highlights: [
      "Outbreak co-op PvE event vs infected, March 6 to April 3",
      "First season to add two attackers and no defender",
      "Three Outbreak-only co-op areas: Resort, Hospital, Junkyard",
      "Outbreak Packs debut as event-exclusive cosmetic loot",
    ],
  },
  Y3S2_ParaBellum: {
    release: "June 7, 2018",
    summary:
      "Year 3 Season 2 deploys Italian GIS defenders Alibi and Maestro on the new Tuscan map Villa, alongside a Clubhouse map buff, a new counter-defuser device for disabling planted defusers, Pick & Ban settings, and an Echo buff.",
    operators: [
      {
        name: "Alibi",
        side: "defender",
        ctu: "GIS",
        gadget: "Prisma hologram decoys that ping shooters",
      },
      {
        name: "Maestro",
        side: "defender",
        ctu: "GIS",
        gadget: "Evil Eye bulletproof laser turret cams",
      },
    ],
    maps: [{ name: "Villa", kind: "new" }],
    highlights: [
      "Pick & Ban operator draft settings introduced",
      "Counter-defuser device replaces melee animation for defuser disable",
      "ACS12 full-auto shotgun debuts on both new operators",
      "Echo buffed with a second Yokai drone",
    ],
  },
  Y3S3_GrimSky: {
    release: "September 4, 2018",
    summary:
      "Year 3 Season 3 adds attacker Maverick with a breaching blowtorch and shield defender Clash, and delivers the first full map rework with Hereford Base plus a Consulate buff, sight misalignment fixes, and a hatch destruction rework.",
    operators: [
      {
        name: "Maverick",
        side: "attacker",
        ctu: "GSUTR (Delta Force)",
        gadget: "Suri Torch breaching blowtorch",
      },
      {
        name: "Clash",
        side: "defender",
        ctu: "GSUTR (Metropolitan Police)",
        gadget: "CCE Shield with slowing taser",
      },
    ],
    maps: [{ name: "Hereford Base", kind: "rework" }],
    highlights: [
      "First full map rework: Hereford Base redesigned",
      "Weapon sight misalignment fix",
      "Hatch destruction rework",
    ],
  },
  Y3S4_WindBastion: {
    release: "December 4, 2018",
    summary:
      "Operation Wind Bastion is Year 3 Season 4 of Rainbow Six Siege, set in Morocco. It adds GIGR operators Nomad (attacker) and Kaid (defender) and the Fortress map, a large daytime kasbah in the country's southern region.",
    operators: [
      {
        name: "Nomad",
        side: "attacker",
        ctu: "GIGR",
        gadget: "Airjab repulsion grenade launcher",
      },
      {
        name: "Kaid",
        side: "defender",
        ctu: "GIGR",
        gadget: "Rtila Electroclaw electrifies reinforcements",
      },
    ],
    maps: [{ name: "Fortress", kind: "new" }],
    highlights: [
      "Kaid debuts the TCSG12 slug shotgun and AUG A3 SMG",
      "Redesigned in-game shop with new navigation and fullscreen views",
      "Pilot Program esports uniforms and headgear, 30% revenue share",
    ],
  },
  Y4S1_BurntHorizon: {
    release: "March 6, 2019",
    summary:
      "Operation Burnt Horizon opens Year 4 with an Australian theme, adding SASR operators Gridlock and Mozzie and the Outback map, alongside a Newcomer playlist and MMR rollback against banned cheaters.",
    operators: [
      {
        name: "Gridlock",
        side: "attacker",
        ctu: "SASR",
        gadget: "Trax Stingers spike traps",
      },
      {
        name: "Mozzie",
        side: "defender",
        ctu: "SASR",
        gadget: "Pest launcher hacks attacker drones",
      },
    ],
    maps: [{ name: "Outback", kind: "new" }],
    highlights: [
      "Newcomer playlist for players under level 50",
      "MMR rollback refunds rank changes from cheater matches",
      "Casual gets preset bomb sites and a 3:30 action phase",
    ],
  },
  Y4S2_PhantomSight: {
    release: "June 11, 2019",
    summary:
      "Year 4 Season 2 adds stealth attacker Nøkk and defender Warden, reworks Kafe Dostoyevsky, and standardizes Ranked on Pick & Ban, Bomb and 3-round rotations while expanding reverse friendly fire to all damage types.",
    operators: [
      {
        name: "Nøkk",
        side: "attacker",
        ctu: "Jaeger Corps",
        gadget: "HEL hides her from cameras and drones",
      },
      {
        name: "Warden",
        side: "defender",
        ctu: "Secret Service",
        gadget: "Glance glasses see through smoke",
      },
    ],
    maps: [{ name: "Kafe Dostoyevsky", kind: "rework" }],
    highlights: [
      "Ranked standardizes Pick & Ban, Bomb mode and 3-round rotations",
      "Reverse friendly fire extended to all damage types",
      "Redesigned in-game shop with featured items and recommendations",
      "New Ranked guide showing season rewards, map pool and stats",
    ],
  },
  Y4S3_EmberRise: {
    release: "September 11, 2019",
    summary:
      "Year 4 Season 3 adds Latin American operators Amaru (APCA, Peru) and Goyo (FES, Mexico), a full rework of Kanal, an Unranked playlist, the Champion rank tier, and the game's first mini battle pass.",
    operators: [
      {
        name: "Amaru",
        side: "attacker",
        ctu: "APCA",
        gadget: "Garra Hook grapple for rapid entry",
      },
      {
        name: "Goyo",
        side: "defender",
        ctu: "FES",
        gadget: "Volcan Shield with incendiary charge",
      },
    ],
    maps: [{ name: "Kanal", kind: "rework" }],
    highlights: [
      "Unranked playlist with the full Ranked ruleset",
      "New Champion rank above Diamond at 5000+ MMR",
      "First mini battle pass, Call Me Harry",
      "Kanal rework adds a second bridge and new sites",
    ],
  },
  Y4S4_ShiftingTides: {
    release: "December 3, 2019",
    summary:
      "Year 4 Season 4 introduces Nighthaven operators Kali and Wamai alongside a reworked Theme Park map. The season adds a limb penetration system and the CSRX 300, the game's first bolt-action sniper rifle.",
    operators: [
      {
        name: "Kali",
        side: "attacker",
        ctu: "Nighthaven",
        gadget: "LV Explosive Lance anti-gadget charges",
      },
      {
        name: "Wamai",
        side: "defender",
        ctu: "Nighthaven",
        gadget: "Mag-NET projectile-catching discs",
      },
    ],
    maps: [{ name: "Theme Park", kind: "rework" }],
    highlights: [
      "CSRX 300 bolt-action sniper rifle debuts",
      "Limb penetration added for most weapons",
      "Rappel exit now requires manual confirmation",
      "Casual playlist renamed Quick Match",
    ],
  },
  Y5S1_VoidEdge: {
    release: "March 10, 2020",
    summary:
      "Year 5 Season 1 introduces Dutch attacker Iana with a controllable holographic decoy and Jordanian defender Oryx with a dashing breach ability, alongside a rework of the Oregon map.",
    operators: [
      {
        name: "Iana",
        side: "attacker",
        ctu: "REU",
        gadget: "Gemini Replicator holographic decoy",
      },
      {
        name: "Oryx",
        side: "defender",
        ctu: "Unaffiliated (Jordan)",
        gadget: "Remah Dash charge through soft walls",
      },
    ],
    maps: [{ name: "Oregon", kind: "rework" }],
    highlights: [
      "Oregon rework with new Kitchen corridor and expanded basement",
      "Attacker drone spawns become deterministic instead of random",
      "Barricade debris cleanup for consistent sightlines",
      "Around the World Battle Pass with free and premium tracks",
    ],
  },
  Y5S2_SteelWave: {
    release: "June 16, 2020",
    summary:
      "Operation Steel Wave is Year 5 Season 2 of Rainbow Six Siege, adding Nighthaven attacker Ace and Inkaba Task Force defender Melusi alongside a reworked House map, the Proximity Alarm secondary gadget, and unified global MMR.",
    operators: [
      {
        name: "Ace",
        side: "attacker",
        ctu: "Nighthaven",
        gadget: "S.E.L.M.A. throwable hydraulic breacher",
      },
      {
        name: "Melusi",
        side: "defender",
        ctu: "Inkaba Task Force",
        gadget: "Banshee sonic devices that slow enemies",
      },
    ],
    maps: [{ name: "House", kind: "rework" }],
    highlights: [
      "House map rework with a new southern wing and revised bomb sites",
      "Proximity Alarm added as new defender secondary gadget",
      "Unified global MMR replacing region-specific ranked ratings",
    ],
  },
  Y5S3_ShadowLegacy: {
    release: "September 10, 2020",
    summary:
      "Year 5 Season 3 brings Splinter Cell's Sam Fisher to Siege as attacker Zero and reworks Chalet, alongside core updates: Ping 2.0, the Hard Breach Charge secondary gadget, map bans, and a unified optics overhaul.",
    operators: [
      {
        name: "Zero",
        side: "attacker",
        ctu: "ROS",
        gadget: "Argus Launcher wall-piercing cameras",
      },
    ],
    maps: [{ name: "Chalet", kind: "rework" }],
    highlights: [
      "Ping 2.0 contextual pinging, usable from cams and after death",
      "Hard Breach Charge secondary gadget for attackers",
      "Map ban voting before matches",
      "Optics overhaul with new 1.5x and 2.0x scopes",
    ],
  },
  Y5S4_NeonDawn: {
    release: "December 1, 2020",
    summary:
      "Year 5 Season 4 adds Thai defender Aruni with her Surya Gate laser barriers and a reworked Skyscraper map, alongside broad operator balancing and the launch of next-gen console versions.",
    operators: [
      {
        name: "Aruni",
        side: "defender",
        ctu: "Nighthaven",
        gadget: "Surya Gate laser barriers",
      },
    ],
    maps: [{ name: "Skyscraper", kind: "rework" }],
    highlights: [
      "Jager's ADS reworked: infinite charges, 10s cooldown",
      "Echo's Yokai drone made permanently visible",
      "Runout detection timer cut from 2s to 1s",
      "PS5 and Xbox Series X|S versions launch alongside the season",
    ],
  },
  Y6S1_CrimsonHeist: {
    release: "March 16, 2021",
    summary:
      "Year 6 Season 1 introduces Argentinian attacker Flores with his RCE-Ratero explosive drone, alongside a rework of the Border map, the Gonne-6 explosive secondary weapon, and a Match Replay beta on PC.",
    operators: [
      {
        name: "Flores",
        side: "attacker",
        ctu: "Unaffiliated (Argentina)",
        gadget: "RCE-Ratero remote explosive drone",
      },
    ],
    maps: [{ name: "Border", kind: "rework" }],
    highlights: [
      "Gonne-6 explosive secondary added to select attacker loadouts",
      "Match Replay beta on PC to re-watch matches from any angle",
      "Defuser auto-assigned if unclaimed at end of planning phase",
      "Newcomer playlist reworked with a rotating seasonal map",
    ],
  },
  Y6S2_NorthStar: {
    release: "June 14, 2021",
    summary:
      "Year 6 Season 2 adds Canadian defender Thunderbird, whose Kóna Stations heal and revive nearby operators, and a competitive rework of Favela, alongside bulletproof camera, Smoke gas propagation, and death-experience overhauls.",
    operators: [
      {
        name: "Thunderbird",
        side: "defender",
        ctu: "STAR-NET Aviation",
        gadget: "Kóna Healing Stations",
      },
    ],
    maps: [{ name: "Favela", kind: "rework" }],
    highlights: [
      "Bulletproof Camera rework: rotation plus an EMP burst shot",
      "Smoke gas propagation rework stops gas passing through surfaces",
      "Death rework: skippable animations, bodies become transparent icons",
      "Melee now shatters Mira mirrors, Evil Eyes and bulletproof cams",
    ],
  },
  Y6S3_CrystalGuard: {
    release: "September 7, 2021",
    summary:
      "Year 6 Season 3 adds Croatian Nighthaven attacker Osa with her transparent bulletproof Talon-8 Shield, reworks Bank, Coastline and Clubhouse, and converts operator armor ratings into a flat HP system.",
    operators: [
      {
        name: "Osa",
        side: "attacker",
        ctu: "Nighthaven",
        gadget: "Talon-8 transparent bulletproof shields",
      },
    ],
    maps: [
      { name: "Bank", kind: "rework" },
      { name: "Coastline", kind: "rework" },
      { name: "Clubhouse", kind: "rework" },
    ],
    highlights: [
      "Armor stat converted to HP: 100/110/125 health pools",
      "Individual attacker spawn selection in all playlists",
      "Elite customization mixes Elite uniforms with any headgear",
      "Ranked skill distribution rework with expanded Diamond tiers",
    ],
  },
  Y6S4_HighCalibre: {
    release: "November 30, 2021",
    summary:
      "Year 6 Season 4 adds Irish defender Thorn with the Razorbloom Shell blade trap and UZK50Gi SMG, reworks Outback, and ships team color options, Elite 2.0 customization, and HUD updates.",
    operators: [
      {
        name: "Thorn",
        side: "defender",
        ctu: "Emergency Response Unit",
        gadget: "Razorbloom Shell proximity blade trap",
      },
    ],
    maps: [{ name: "Outback", kind: "rework" }],
    highlights: [
      "UZK50Gi .50-cal SMG debuts as Thorn's primary",
      "Team colors become customizable, defaulting to blue vs red",
      "Elite 2.0 customization and HUD rework with drone counter",
    ],
  },
  Y7S1_DemonVeil: {
    release: "March 15, 2022",
    summary:
      "Year 7 Season 1 has a Japanese theme and adds defender Azami with her Kiba Barrier kunai. The launch brings permanent Team Deathmatch, attacker repick, and expanded sight options; the new Emerald Plains map arrives mid-season.",
    operators: [
      {
        name: "Azami",
        side: "defender",
        ctu: "TMPD Security Police",
        gadget: "Kiba Barrier expanding kunai walls",
      },
    ],
    maps: [],
    highlights: [
      "Team Deathmatch arrives as a permanent playlist",
      "Attacker repick allows operator swaps during prep phase",
      "All non-magnifying sights unlocked on most weapons",
      "Goyo rework detaches Volcan canisters from shields",
    ],
  },
  Y7S2_VectorGlare: {
    release: "June 14, 2022",
    summary:
      "Year 7 Season 2 introduces Belgian attacker Sens, whose R.O.U. Projector creates vision-blocking light walls, alongside Close Quarter, a map built for Team Deathmatch, and a new Shooting Range practice area.",
    operators: [
      {
        name: "Sens",
        side: "attacker",
        ctu: "SFG",
        gadget: "R.O.U. Projector rolling light walls",
      },
    ],
    maps: [{ name: "Close Quarter", kind: "new" }],
    highlights: [
      "Close Quarter, first map built for Team Deathmatch",
      "Shooting Range with recoil and damage lanes for weapon testing",
      "New POF-9 assault rifle debuts with Sens",
      "Privacy Mode and reputation penalties for reverse friendly fire",
    ],
  },
  Y7S3_BrutalSwarm: {
    release: "September 6, 2022",
    summary:
      "Year 7 Season 3 introduces Nighthaven attacker Grim with the Kawan Hive Launcher and adds Stadium Bravo as a permanent map, alongside a PC recoil overhaul and a new Impact EMP grenade secondary gadget.",
    operators: [
      {
        name: "Grim",
        side: "attacker",
        ctu: "Nighthaven",
        gadget: "Kawan Hive swarm-tracking bot launcher",
      },
    ],
    maps: [{ name: "Stadium Bravo", kind: "new" }],
    highlights: [
      "PC recoil system overhaul with progressive recoil",
      "Impact EMP grenade secondary gadget for 8 operators",
      "Map ban phase expanded to show 5 maps",
      "Rook armor plates now grant Withstand when downed",
    ],
  },
  Y7S4_SolarRaid: {
    release: "December 6, 2022",
    summary:
      "Year 7 Season 4 adds Colombian defender Solis and the Nighthaven Labs map, and introduces console cross-play, cross-progression across all platforms, Ranked 2.0 with the Emerald rank, and a battle pass with branching paths.",
    operators: [
      {
        name: "Solis",
        side: "defender",
        ctu: "AFEAU",
        gadget: "SPEC-IO sensor tags enemy electronics",
      },
    ],
    maps: [{ name: "Nighthaven Labs", kind: "new" }],
    highlights: [
      "Console cross-play and cross-progression on all platforms",
      "Ranked 2.0 with Rank Points and new Emerald rank",
      "Battle pass reworked with branching progression paths",
      "Reputation standing display enters beta",
    ],
  },
  Y8S1_CommandingForce: {
    release: "March 7, 2023",
    summary:
      "Year 8 Season 1 introduces Brazilian COT attacker Brava, whose Kludge Drone hijacks or destroys defender electronics. It ships a reload rework and operator specialties, with no new map; the MouseTrap console anti-cheat follows mid-season.",
    operators: [
      {
        name: "Brava",
        side: "attacker",
        ctu: "COT",
        gadget: "Kludge Drone hijacks defender electronics",
      },
    ],
    maps: [],
    highlights: [
      "Reload rework with round-in-chamber for closed-bolt weapons",
      "Operator specialties system with beginner challenges",
      "Playlists reorganized into Competitive, Quick Play and Training",
      "MouseTrap console anti-cheat added mid-season (Y8S1.2)",
    ],
  },
  Y8S2_DreadFactor: {
    release: "May 30, 2023",
    summary:
      "Year 8 Season 2 adds Swedish defender Fenrir with fear-gas F-NATT Dread Mines, reworks Consulate, makes the Arcade playlist permanent, and introduces the Observation Blocker secondary gadget for defenders.",
    operators: [
      {
        name: "Fenrir",
        side: "defender",
        ctu: "Redhammer",
        gadget: "F-NATT Dread Mines (fear gas)",
      },
    ],
    maps: [{ name: "Consulate", kind: "rework" }],
    highlights: [
      "Arcade playlist made permanent, adds Free For All mode",
      "New Observation Blocker gadget blocks drone line of sight",
      "Free camera added to Match Replay",
      "Shooting Range gains moving-target Aiming Lane",
    ],
  },
  Y8S3_HeavyMettle: {
    release: "August 29, 2023",
    summary:
      "Year 8 Season 3 adds South Korean attacker Ram with the BU-GI Auto-Breacher demolition drone. It ships no new map but reworks playlists with Quick Match 2.0 and Standard, adds commendations, Weapon Roulette, and a shotgun overhaul.",
    operators: [
      {
        name: "Ram",
        side: "attacker",
        ctu: "35th Commando Battalion",
        gadget: "BU-GI Auto-Breacher demolition drone",
      },
    ],
    maps: [],
    highlights: [
      "Quick Match 2.0 and new Standard playlist replace Unranked",
      "Commendation system for recognizing positive player behavior",
      "Weapon Roulette permanent arcade mode",
      "Shotgun overhaul and Grim Kawan Hive buff; Frost rework mid-season",
    ],
  },
  Y8S4_DeepFreeze: {
    release: "December 6, 2023",
    summary:
      "Year 8 Season 4 introduces Portuguese defender Tubarão with gadget-freezing Zoto Canisters and the new map Lair, Deimos' base of operations. It also reworks frag grenades and opens sign-ups for the R6 Marketplace beta.",
    operators: [
      {
        name: "Tubarão",
        side: "defender",
        ctu: "DAE",
        gadget: "Zoto Canister gadget-freezing throwables",
      },
    ],
    maps: [{ name: "Lair", kind: "new" }],
    highlights: [
      "Frag grenade rework removes cooking, shortens fuse times",
      "R6 Marketplace announced; beta sign-ups open (launch early 2024)",
      "Versus AI playlist beta and new Map Training playlist",
      "Controller remapping and deadzone customization",
    ],
  },
  Y9S1_DeadlyOmen: {
    release: "March 12, 2024",
    summary:
      "Year 9 Season 1 introduces Deimos, the franchise's first villain operator, and ships no new map. The season centers on a full shield rework, an attachment and optics overhaul, and a new anti-cheat detection model.",
    operators: [
      {
        name: "Deimos",
        side: "attacker",
        ctu: "Keres Legion",
        gadget: "DeathMARK Tracker hunting probe",
      },
    ],
    maps: [],
    highlights: [
      "Full shield rework: sprinting, free look, guard break, no hip fire",
      "Attachment overhaul adds Horizontal Grip and reworked scope zooms",
      "New anti-cheat detection model and stricter Ranked entry rules",
      "Deimos wields the .44 Vendetta magnum tied to his DeathMARK",
    ],
  },
  Y9S2_NewBlood: {
    release: "June 11, 2024",
    summary:
      "Year 9 Season 2 reworks the classic Recruit into two operators, Striker and Sentry, with flexible secondary gadget loadouts. The season adds no new map; the Marketplace exits beta and the R6 Membership subscription debuts.",
    operators: [
      {
        name: "Striker",
        side: "attacker",
        ctu: "ROS",
        gadget: "Any two attacker secondary gadgets",
      },
      {
        name: "Sentry",
        side: "defender",
        ctu: "ROS",
        gadget: "Any two defender secondary gadgets",
      },
    ],
    maps: [],
    highlights: [
      "Recruit reworked into Striker and Sentry with flexible loadouts",
      "Marketplace launches fully out of beta for skin trading",
      "R6 Membership subscription replaces the Year Pass",
      "Fenrir and Solis receive major nerfs",
    ],
  },
  Y9S3_TwinShells: {
    release: "September 10, 2024",
    summary:
      "Twin Shells is Y9S3 of Rainbow Six Siege, adding Skopós, a defender who remotely operates two robotic V10 Pantheon Shells and swaps between them. The launch also brings the Siege Cup beta tournament and the PCX-33 rifle, with no new map.",
    operators: [
      {
        name: "Skopós",
        side: "defender",
        ctu: "EKAM",
        gadget: "V10 Pantheon Shells twin robot bodies",
      },
    ],
    maps: [],
    highlights: [
      "Siege Cup beta, an in-game 5v5 tournament ladder on PC",
      "New PCX-33 assault rifle debuts with Skopos",
      "Drone speed boost and After Action Report 2.0",
      "DX12 becomes the default graphics API on PC",
    ],
  },
  Y9S4_CollisionPoint: {
    release: "December 3, 2024",
    summary:
      "Year 9 Season 4 closes 2024 with no new operator or map; it reworks Blackbeard around the H.U.L.L. Adaptable Shield, adds console-to-PC crossplay, a career hub with badges, shield nerfs, and brings the Siege Cup beta to all platforms.",
    operators: [],
    maps: [],
    highlights: [
      "Blackbeard rework: H.U.L.L. Adaptable Shield, rifle + soft breach",
      "Console-to-PC crossplay with separate ranked progression",
      "Shields nerfed: melee damage removed, earlier suppressive fire",
      "Siege Cup beta in-game tournaments expand to all platforms",
    ],
  },
  Y10S1_PrepPhase: {
    release: "March 4, 2025",
    summary:
      "Year 10 Season 1 adds New Zealand attacker Rauora, whose D.O.M. Panel Launcher lets attackers barricade doors with bulletproof panels. The season activates the full Reputation System, updates matchmaking, and precedes Siege X.",
    operators: [
      {
        name: "Rauora",
        side: "attacker",
        ctu: "NZSAS",
        gadget: "D.O.M. Panel Launcher bulletproof doors",
      },
    ],
    maps: [],
    highlights: [
      "Full Reputation System rollout with penalties and rewards",
      "Dynamic Matchmaking 1.0 adapts to server load for better matches",
      "DX11 removed on PC, DirectX 12 becomes mandatory",
      "Final season before the Siege X overhaul",
    ],
  },
  Y10S2_DayBreak: {
    release: "June 10, 2025",
    summary:
      "Operation Daybreak (Y10S2) launches alongside the free Siege X overhaul. It adds no new operator, instead delivering the permanent 6v6 Dual Front mode on the new District map, five modernized maps, a Clash remaster, and Free Access.",
    operators: [],
    maps: [
      { name: "District", kind: "new" },
      { name: "Bank", kind: "rework" },
      { name: "Clubhouse", kind: "rework" },
      { name: "Border", kind: "rework" },
      { name: "Chalet", kind: "rework" },
      { name: "Kafe Dostoyevsky", kind: "rework" },
    ],
    highlights: [
      "Siege X overhaul: audio rework, advanced rappel, destructible props",
      "Dual Front permanent 6v6 mode on the new District map",
      "Clash remaster: anchorable CCE Shield MK2 with remote taser",
      "Free Access model and flexible in-match Pick & Ban",
    ],
  },
  Y10S3_HighStakes: {
    release: "September 2, 2025",
    summary:
      "Year 10 Season 3 of Siege X adds Swiss Nighthaven defender Denari with the T.R.I.P. Connector laser grid, modernizes Consulate, Nighthaven Labs, and Lair, and nerfs Blackbeard while removing magnified sights from defender automatic weapons.",
    operators: [
      {
        name: "Denari",
        side: "defender",
        ctu: "Nighthaven",
        gadget: "T.R.I.P. laser grids that damage and slow",
      },
    ],
    maps: [
      { name: "Consulate", kind: "rework" },
      { name: "Nighthaven Labs", kind: "rework" },
      { name: "Lair", kind: "rework" },
    ],
    highlights: [
      "Dual Front adds Keres Safe Room data extraction objective",
      "Blackbeard nerfed, defender automatic weapons lose magnified sights",
      "Reaper MK2 secondary weapon added for select operators",
      "Automated voice chat moderation and full ranked reset",
    ],
  },
  Y10S4_TenfoldPursuit: {
    release: "December 2, 2025",
    summary:
      "Year 10 Season 4 marks Siege's 10th anniversary. It ships no new operator, instead remastering Thatcher with the E.G.S. Disruptor, reworking Fortress, and adding the PMR90A2 DMR plus the Wildcards Siege anniversary event.",
    operators: [],
    maps: [{ name: "Fortress", kind: "rework" }],
    highlights: [
      "Thatcher remaster: E.G.S. Disruptor replaces his EMP grenades",
      "PMR90A2 marksman rifle for Thatcher, Hibana, Capitao and Nokk",
      "Wildcards Siege anniversary event on House with login rewards",
      "Ranked matchmaking factors visible rank alongside hidden MMR",
    ],
  },
  Y11S1_SilentHunt: {
    release: "March 3, 2026",
    summary:
      "Year 11 Season 1 centers on a Metal Gear Solid crossover, adding Solid Snake as an attacker. The season launches with the TACIT .45 pistol, modernized Coastline, Villa and Oregon maps, and a major balancing update.",
    operators: [
      {
        name: "Solid Snake",
        side: "attacker",
        ctu: "Rainbow",
        gadget: "Soliton Radar Mk. III minimap marks enemies",
      },
    ],
    maps: [
      { name: "Coastline", kind: "rework" },
      { name: "Villa", kind: "rework" },
      { name: "Oregon", kind: "rework" },
    ],
    highlights: [
      "New TACIT .45 suppressed secondary pistol",
      "Major balancing update targeting entry fraggers and roamers",
      "Ranked map pool reduced from 16 to 13 maps",
      "Final Dual Front season before the mode is removed",
    ],
  },
};
