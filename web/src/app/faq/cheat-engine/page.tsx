import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Callout } from "@/components/Callout";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { ExternalLink } from "@/components/ExternalLink";
import { DownloaderButton } from "@/components/DownloaderButton";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { OnLinux } from "@/components/OnLinux";
import { OnWindows } from "@/components/OnWindows";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Cheat Engine",
  description: "How to use Cheat Engine to modify old Rainbow Six Siege.",
});

const tables = [
  {
    name: "Y3S1 Chimera",
    description: "Spawns far more enemies across all Terrorist Hunt modes.",
    file: "y3s1-chimera.ct",
    download: "Y3S1_Chimera.ct",
  },
  {
    name: "Y5S3 Shadow Legacy",
    description:
      "Adds mass spawns, health and ammo tweaks, near-unlimited survivability, longer defuse timers, and outside-zone access to Terrorist Hunt.",
    file: "y5s3-shadowlegacy.ct",
    download: "Y5S3_ShadowLegacy.ct",
  },
];

const faqs: FaqItem[] = [
  {
    q: "Do the tables work on other seasons?",
    a: (
      <p>
        No. A table only works with the exact build it was made for, so it
        matches only the season named on its card above. On any other build the
        memory addresses do not line up.
      </p>
    ),
  },
  {
    q: "Do I have to load the table every time?",
    a: (
      <p>
        Yes. A table loads into memory for the current session only and does not
        modify any game files. Load it again each time you launch the game.
      </p>
    ),
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

      <OnWindows>
        <Callout label="// NOTE">
          Cheat Engine and the tables below are often flagged by antivirus
          software as a false positive. You may need to add an exclusion — see
          the <Link href="/faq/antivirus">Antivirus</Link> page for details.
        </Callout>
      </OnWindows>

      <SectionTitle>Cheat Engine Setup</SectionTitle>
      <Prose>
        <ol>
          <OnWindows>
            <li>
              Download{" "}
              <ExternalLink href="https://www.cheatengine.org/downloads.php">
                Cheat Engine
              </ExternalLink>{" "}
              for Windows and run the installer
            </li>
          </OnWindows>
          <OnLinux>
            <li>
              Download{" "}
              <ExternalLink href="https://www.cheatengine.org/downloads.php">
                Cheat Engine
              </ExternalLink>{" "}
              for Windows and{" "}
              <ExternalLink href="https://github.com/Matoking/protontricks">
                protontricks
              </ExternalLink>
            </li>
            <li>
              Run the Cheat Engine installer with{" "}
              <code>protontricks-launch</code> and select the season shortcut
              when asked
            </li>
          </OnLinux>
          <li>
            Click through the installer and{" "}
            <strong>deny any bundled offers</strong> to avoid adware
          </li>
          <li>
            Open <code>Config.toml</code> in the season folder
          </li>
          <li>
            Add the path of your installed Cheat Engine to the{" "}
            <code>tools</code> entry, for example{" "}
            <code>
              tools = [&apos;C:\Program Files\Cheat Engine\Cheat
              Engine.exe&apos;]
            </code>
          </li>
          <li>Cheat Engine opens alongside the game</li>
        </ol>
      </Prose>

      <SectionTitle>How to Use Cheat Engine</SectionTitle>
      <Prose>
        <ol>
          <li>Dismiss the pop-ups the first time you open Cheat Engine</li>
          <li>
            Download a table below and double-click the <code>.ct</code> file to
            load it. If no entry appears in the cheat list at the bottom of the
            Cheat Engine window, load the file manually via the{" "}
            <strong>folder icon</strong>
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

      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <FaqAccordion items={faqs} />
    </>
  );
}
