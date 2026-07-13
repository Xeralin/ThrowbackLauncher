export type CreditRole =
  | "admin"
  | "moderator"
  | "developer"
  | "seniorhelper"
  | "helper";

type CreditSection = "faqContributors" | "staff";

export type CreditUser = {
  name: string;
  role: CreditRole;
  title: string;
  tags: string[];
  github: string | null;
  dono: string | null;
  avatar: string;
  sections: CreditSection[];
};

export const sectionOrder: { id: CreditSection; label: string }[] = [
  { id: "faqContributors", label: "FAQ Contributors" },
  { id: "staff", label: "Staff" },
];

export const users: CreditUser[] = [
  {
    name: "Astrea",
    role: "admin",
    title: "Administrator",
    tags: ["Artemis"],
    github: "https://github.com/Astrea0014",
    dono: null,
    avatar: "/media/discord-avatars/astrea.webp",
    sections: ["staff"],
  },
  {
    name: "Puppetino",
    role: "admin",
    title: "Administrator",
    tags: ["FAQ", "Legacy FAQ", "Discord Bot"],
    github: "https://github.com/Puppetino",
    dono: "https://www.buymeacoffee.com/Puppetino",
    avatar: "/media/discord-avatars/puppetino.webp",
    sections: ["faqContributors"],
  },
  {
    name: "Midly",
    role: "admin",
    title: "Administrator",
    tags: [],
    github: "https://github.com/midly202",
    dono: null,
    avatar: "/media/discord-avatars/midly.webp",
    sections: ["staff"],
  },
  {
    name: "Muhnkie",
    role: "moderator",
    title: "Moderator",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/discord-avatars/muhnkie.webp",
    sections: ["staff"],
  },
  {
    name: "Sweetteatv",
    role: "moderator",
    title: "Moderator",
    tags: [],
    github: "https://github.com/OgSpit",
    dono: null,
    avatar: "/media/discord-avatars/sweetteatv.webp",
    sections: ["staff"],
  },
  {
    name: "Auralicy",
    role: "moderator",
    title: "Moderator",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/discord-avatars/auralicy.webp",
    sections: ["staff"],
  },
  {
    name: "Xera",
    role: "developer",
    title: "Developer",
    tags: ["FAQ", "Launcher", "Liberator", "ThrowbackLoader"],
    github: "https://github.com/Xeralin",
    dono: null,
    avatar: "/media/discord-avatars/xeralin.webp",
    sections: ["staff", "faqContributors"],
  },
  {
    name: "AKrisz2",
    role: "developer",
    title: "Developer",
    tags: ["R6S Downloader"],
    github: "https://github.com/AKrisz2",
    dono: null,
    avatar: "/media/discord-avatars/akrisz2.webp",
    sections: ["staff"],
  },
  {
    name: "Benjaminstrike",
    role: "developer",
    title: "Developer",
    tags: ["Discord AI"],
    github: "https://github.com/benjaminstrike",
    dono: null,
    avatar: "/media/discord-avatars/benjaminstrike.gif",
    sections: ["staff"],
  },
  {
    name: "Lordelias",
    role: "developer",
    title: "Developer",
    tags: [],
    github: "https://github.com/LordEliasTM",
    dono: null,
    avatar: "/media/discord-avatars/lordelias.webp",
    sections: ["staff"],
  },
  {
    name: "0xLusion",
    role: "developer",
    title: "Developer",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/discord-avatars/0xlusion.webp",
    sections: ["staff"],
  },
  {
    name: "Seopung",
    role: "developer",
    title: "Developer",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/discord-avatars/seopung.webp",
    sections: ["staff"],
  },
  {
    name: "JVAV",
    role: "developer",
    title: "Developer",
    tags: ["Legacy FAQ", "R6S Downloader"],
    github: "https://github.com/JOJOVAV",
    dono: "https://buymeacoffee.com/jvav",
    avatar: "/media/discord-avatars/jvav.webp",
    sections: ["staff"],
  },
  {
    name: "Techtical",
    role: "seniorhelper",
    title: "Senior Helper",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/discord-avatars/techtical.webp",
    sections: ["staff"],
  },
  {
    name: "ConfusingFool93",
    role: "helper",
    title: "Helper",
    tags: [],
    github: "https://github.com/AvacadoWizard120",
    dono: null,
    avatar: "/media/discord-avatars/confusingfool93.webp",
    sections: ["staff"],
  },
  {
    name: "dredis",
    role: "helper",
    title: "Helper",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/discord-avatars/dredis.webp",
    sections: ["staff"],
  },
  {
    name: "Wntr",
    role: "helper",
    title: "Helper",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/discord-avatars/wntr.webp",
    sections: ["staff"],
  },
  {
    name: "Celestarr",
    role: "helper",
    title: "Helper",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/discord-avatars/celestarr.webp",
    sections: ["staff"],
  },
  {
    name: "xanax",
    role: "helper",
    title: "Helper",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/discord-avatars/xanax.webp",
    sections: ["staff"],
  },
];
