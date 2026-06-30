import type { TagVariant } from "@/components/Tag";

export type VideoEntry = {
  videoId: string;
  title: string;
  by: string;
  description: string;
  tags: { label: string; variant?: TagVariant }[];
};

export const videos: VideoEntry[] = [
  {
    videoId: "HuzP-vYgBZU",
    title: "Getting Started with the Launcher",
    by: "AURALICY",
    description:
      "A step-by-step walkthrough on downloading and launching an older season of R6S with the Launcher.",
    tags: [
      { label: "Getting Started", variant: "green" },
      { label: "Download" },
    ],
  },
];
