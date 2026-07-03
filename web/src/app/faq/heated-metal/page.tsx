import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { SeasonTable } from "@/components/SeasonTable";
import { ExternalLink } from "@/components/ExternalLink";
import { DownloaderButton } from "@/components/DownloaderButton";
import { Callout } from "@/components/Callout";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Heated Metal",
  description:
    "An SDK for Rainbow Six Siege — map editor, extended scripting, unlock all, and more.",
});

const heatedMetalSeasons: [string, string, string][] = [
  ["Y5S3", "Shadow Legacy (v0.2.3)", "15018155"],
  ["Y5S4", "Neon Dawn", "15241382"],
  ["Y9S2", "New Blood", "72730050"],
];

export default function HeatedMetal() {
  return (
    <>
      <Hero
        tag="Tools & Mods"
        corner="HM"
        title={<em>Heated Metal</em>}
        description="An SDK for Rainbow Six Siege — map editor, extended scripting, unlock all, and more."
      />

      <SectionTitle>What is Heated Metal?</SectionTitle>
      <Prose>
        <p>
          Heated Metal is a full SDK (Software Development Kit) for R6S that
          adds extended capabilities to specific old game builds. It includes:
        </p>
        <ul>
          <li>A full in-game map editor</li>
          <li>Extended scripting and an in-game console</li>
          <li>Unlock all cosmetics and attachments</li>
          <li>Custom keybinds and host networking controls</li>
        </ul>
      </Prose>

      <SectionTitle>Supported Seasons</SectionTitle>
      <Prose>
        <SeasonTable rows={heatedMetalSeasons} />
      </Prose>

      <SectionTitle>Requirements</SectionTitle>
      <Prose>
        <ul>
          <li>The latest Visual C++ Redistributables</li>
          <li>Medium or above in-game textures (Shadow Legacy only)</li>
          <li>A DXVK executable — Vulkan is not supported</li>
          <li>
            External overlays disabled, as they can stop the UI from rendering
          </li>
        </ul>
      </Prose>

      <SectionTitle>Installation</SectionTitle>
      <Prose>
        <ol>
          <li>
            In the Launcher, start a download for one of the supported seasons
            above
          </li>
          <li>
            Enable <strong>Heated Metal</strong> for that season before
            downloading
          </li>
          <li>
            The Launcher downloads the build and adds the SDK automatically — no
            separate tool needed
          </li>
          <li>Launch the game from the Launcher once the download completes</li>
        </ol>
        <p>
          Already have the season installed? Re-run the download with Heated
          Metal enabled, or use <strong>Verify</strong> in the Launcher to add
          the SDK to an existing install.
        </p>
        <p className="note">
          Heated Metal is built by{" "}
          <ExternalLink href="https://github.com/DataCluster0/HeatedMetal">
            DataCluster0
          </ExternalLink>
          . The Launcher fetches and applies it for you when you download a
          supported season.
        </p>
      </Prose>

      <Callout label="// NOTE">
        <strong>Y9S2 New Blood</strong> is only available on the Heated Metal
        Discord, not on GitHub, so the Launcher cannot fetch it for you. Get its
        SDK from the Discord below and add it to that season yourself.
      </Callout>

      <div className="mb-8">
        <DownloaderButton href="https://discord.gg/7mR9VxBxWd" secondary>
          → Heated Metal Discord
        </DownloaderButton>
      </div>

      <SectionTitle>Usage</SectionTitle>
      <Prose>
        <ul>
          <li>
            Press <strong>F1</strong> to open the context menu (console,
            inventory, and more)
          </li>
          <li>
            Press <strong>F3</strong> to open the map editor
          </li>
          <li>
            Run the <code>Setup</code> command in the console to customize your
            keybinds
          </li>
          <li>
            The host can grant admin permissions via{" "}
            <strong>Console → Network → Connections</strong>, unlocking the
            editor and additional features
          </li>
        </ul>
      </Prose>
    </>
  );
}
