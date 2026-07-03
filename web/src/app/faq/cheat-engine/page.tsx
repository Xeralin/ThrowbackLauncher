import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Callout } from "@/components/Callout";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { ExternalLink } from "@/components/ExternalLink";
import { DownloaderButton } from "@/components/DownloaderButton";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Cheat Engine",
  description: "How to use Cheat Engine to modify old Rainbow Six Siege.",
});

const tables = [
  {
    name: "Y3S1 — Chimera",
    description: "Spawns far more enemies across all Terrorist Hunt modes.",
    file: "y3s1-chimera.ct",
    download: "Y3S1_Chimera.ct",
  },
  {
    name: "Y5S3 — Shadow Legacy",
    description:
      "Adds mass spawns, health and ammo tweaks, near-unlimited survivability, longer defuse timers, and outside-zone access to Terrorist Hunt.",
    file: "y5s3-shadowlegacy.ct",
    download: "Y5S3_ShadowLegacy.ct",
  },
];

export default function CheatEngine() {
  return (
    <>
      <Hero
        tag="Tools & Mods"
        corner="CE"
        title={<em>Cheat Engine</em>}
        description="How to use Cheat Engine to modify old Rainbow Six Siege."
      />

      <Callout label="// NOTE">
        Cheat Engine and the tables below are often flagged by antivirus
        software as a false positive. You may need to add an exclusion — see the{" "}
        <Link href="/faq/antivirus">Antivirus</Link> page for details.
      </Callout>

      <SectionTitle>Modify Terrorist Hunt</SectionTitle>
      <Prose>
        <ol>
          <li>
            Download{" "}
            <ExternalLink href="https://www.cheatengine.org/downloads.php">
              Cheat Engine
            </ExternalLink>{" "}
            for Windows and run the installer
          </li>
          <li>
            Click through the installer and{" "}
            <strong>deny any bundled offers</strong> to avoid adware
          </li>
          <li>Dismiss the pop-ups the first time you open Cheat Engine</li>
          <li>
            Download a table below and double-click the <code>.ct</code> file to
            load it — or add it manually via the <strong>folder icon</strong> if
            no entry appears at the bottom
          </li>
          <li>
            Launch the game, then attach Cheat Engine by clicking the{" "}
            <strong>monitor icon</strong> and selecting the game process
          </li>
          <li>
            Tick the <strong>checkbox</strong> next to the table entry to
            activate it
          </li>
        </ol>
      </Prose>

      <SectionTitle>Cheat Tables</SectionTitle>
      <div className="mb-8 flex flex-col gap-4">
        {tables.map((table) => (
          <div
            key={table.file}
            className="rounded-lg border border-border bg-surface p-5"
          >
            <h3 className="font-display text-[1.1rem] font-bold text-text">
              {table.name}
            </h3>
            <p className="mb-3 mt-1 text-[0.88rem] leading-[1.65] text-text-muted">
              {table.description}
            </p>
            <DownloaderButton
              href={`/cheat-tables/${table.file}`}
              download={table.download}
            >
              Download
            </DownloaderButton>
          </div>
        ))}
      </div>
    </>
  );
}
