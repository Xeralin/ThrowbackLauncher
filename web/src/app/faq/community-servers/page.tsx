import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { Callout } from "@/components/Callout";
import { SectionTitle } from "@/components/SectionTitle";
import { ServerGrid } from "@/components/ServerGrid";
import { ExternalLink } from "@/components/ExternalLink";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Community Servers",
  description:
    "Discord servers for playing, modding, and connecting with other old R6S fans.",
  path: "/community-servers",
});

export default function CommunityServers() {
  return (
    <>
      <Hero
        tag="Community"
        corner="DC"
        title={<em>Community Servers</em>}
        description="Discord servers for playing, modding, and connecting with other old R6S fans."
      />
      <Callout label="// NOTE">
        To add your server to this list, or if an invite link is no longer
        working, contact us on the{" "}
        <ExternalLink href={site.discordUrl}>
          official Discord server
        </ExternalLink>
        .
      </Callout>
      <SectionTitle>Servers</SectionTitle>
      <ServerGrid />
    </>
  );
}
