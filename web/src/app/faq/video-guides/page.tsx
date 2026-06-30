import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { Callout } from "@/components/Callout";
import { SectionTitle } from "@/components/SectionTitle";
import { VideoGrid } from "@/components/VideoCard";
import { videos } from "@/content/videos";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Video Guides",
  description:
    "A collection of video guides covering setup, troubleshooting, and gameplay tips.",
  path: "/video-guides",
});

export default function VideoGuides() {
  return (
    <>
      <Hero
        tag="Support"
        corner="YT"
        title={<em>Video Guides</em>}
        description="A collection of video guides covering setup, troubleshooting, and gameplay tips."
      />
      <Callout label="// NOTE">
        Additional guides are still in planning. To have your guide featured
        here, contact @Puppetino directly — it may be added if it meets our
        quality requirements.
      </Callout>
      <SectionTitle>Getting Started</SectionTitle>
      <VideoGrid videos={videos} />
    </>
  );
}
