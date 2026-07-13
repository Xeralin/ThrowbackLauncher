import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { Note } from "@/components/Note";
import { SeasonTable } from "@/components/SeasonTable";
import type { SeasonRow } from "@/config/liberator-builds";
import { ExternalLink } from "@/components/ExternalLink";
import { DownloaderButton } from "@/components/DownloaderButton";
import { Callout } from "@/components/Callout";
import { OnWindows } from "@/components/OnWindows";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Heated Metal",
  description:
    "An SDK for Rainbow Six Siege — map editor, extended scripting, unlock all, and more.",
});

const heatedMetalSeasons: SeasonRow[] = [
  {
    season: "Y5S3",
    operation: "Shadow Legacy",
    version: "v0.2.3",
    build: "15018155",
  },
  {
    season: "Y5S4",
    operation: "Neon Dawn",
    version: "Latest",
    build: "15241382",
  },
  {
    season: "Y9S2",
    operation: "New Blood",
    version: "Open Beta",
    build: "72730050",
  },
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
          Heated Metal is a full SDK (Software Development Kit) for R6S by{" "}
          <ExternalLink href="https://github.com/DataCluster0/HeatedMetal">
            DataCluster0
          </ExternalLink>{" "}
          that adds extended capabilities to specific old game builds. It
          includes the following features.
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
        <SeasonTable rows={heatedMetalSeasons} showVersion />
      </Prose>

      <Callout label="// NOTE">
        <strong>Y9S2 New Blood</strong> is only available on the{" "}
        <ExternalLink href="https://discord.gg/7mR9VxBxWd">
          Heated Metal Discord
        </ExternalLink>
        , so the Launcher cannot fetch the SDK for you. Still choose{" "}
        <strong>Heated Metal</strong> when downloading, then copy the Heated
        Metal files from the Discord into the game folder yourself.
      </Callout>

      <div className="mb-8">
        <DownloaderButton href="https://github.com/DataCluster0/HeatedMetal">
          Repository
        </DownloaderButton>
        <DownloaderButton href="https://discord.gg/7mR9VxBxWd" secondary>
          Discord
        </DownloaderButton>
      </div>

      <SectionTitle>Requirements</SectionTitle>
      <Prose>
        <ul>
          <OnWindows>
            <li>The latest Visual C++ Redistributables</li>
          </OnWindows>
          <li>Medium or above in-game textures (Shadow Legacy only)</li>
          <li>
            The DirectX executable — the Vulkan executable is not supported. The
            Launcher starts the DirectX one for you automatically
          </li>
          <li>
            External overlays disabled, as they can stop the UI from rendering
          </li>
        </ul>
      </Prose>

      <SectionTitle>Installation</SectionTitle>
      <Prose>
        <ol>
          <li>
            In the Launcher, press <strong>Download</strong> on one of the
            supported seasons above
          </li>
          <li>
            Choose <strong>Heated Metal</strong> in the dialog that opens
          </li>
          <li>
            The Launcher downloads the build and adds the SDK automatically — no
            separate tool needed
          </li>
          <li>Launch the game from the Launcher once the download completes</li>
        </ol>
        <OnWindows>
          <Note className="mb-4">
            Heated Metal is often flagged by antivirus software as a false
            positive — if the setup fails, see the{" "}
            <Link href="/faq/antivirus#why-does-my-antivirus-delete-heated-metal">
              Antivirus page
            </Link>
            .
          </Note>
        </OnWindows>
        <p>
          Already have the season installed without Heated Metal? Uninstall it
          first, then download it again and choose <strong>Heated Metal</strong>{" "}
          in the dialog — Heated Metal installs as its own copy of the season.
        </p>
      </Prose>

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
            The host can grant admin permissions in the console under{" "}
            <strong>Network</strong> and then <strong>Connections</strong>,
            unlocking the editor and additional features
          </li>
        </ul>
      </Prose>
    </>
  );
}
