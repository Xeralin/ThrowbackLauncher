import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Note } from "@/components/Note";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { ContentVideo } from "@/components/ContentVideo";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Antivirus",
  description:
    "Common antivirus issues and how to resolve them, including false-positive detections.",
});

const faqs: FaqItem[] = [
  {
    q: "My antivirus is blocking the game. What should I do?",
    a: (
      <>
        <p>
          Some antivirus programs flag game files as false positives.
          Liberator, Heated Metal, and the Launcher itself are common targets.
          The fix is to add both your library folder and the Launcher install
          folder as exclusions. For Windows Security, follow these steps.
        </p>
        <ol>
          <li>
            Search for <strong>Virus & Threat Protection</strong> in the Windows
            start menu
          </li>
          <li>
            Click <strong>Manage settings</strong> under{" "}
            <em>Virus & Threat Protection Settings</em>
          </li>
          <li>
            Scroll down to <em>Exclusions</em> and click{" "}
            <strong>Add or remove exclusions</strong>
          </li>
          <li>
            Click <strong>Add an exclusion</strong>, select{" "}
            <strong>Folder</strong>, and choose your library folder, then repeat
            for the Launcher install folder
          </li>
          <li>Restart your machine and try launching the game again</li>
        </ol>
        <ContentVideo
          src="/media/antivirus-exclusion.webm"
          label="Adding an antivirus exclusion"
          width={1920}
          height={1080}
        />
        <Note className="mt-3">
          Use <strong>Verify</strong> in the Launcher to restore removed game
          files — Liberator and other files in the Launcher install folder
          must be restored from quarantine instead.
        </Note>
      </>
    ),
  },
  {
    q: "Why does my antivirus delete Heated Metal?",
    a: (
      <>
        <p>
          Heated Metal is frequently flagged as a false positive by Windows
          Security and other antivirus software. The files are removed
          automatically while they download, which makes the setup fail.
        </p>
        <p>
          An exclusion does not restore files that were already removed, so the
          order matters.
        </p>
        <ol>
          <li>
            Add both your library folder and the Launcher install folder as
            exclusions first, using{" "}
            <Link href="#my-antivirus-is-blocking-the-game-what-should-i-do">
              the steps above
            </Link>
          </li>
          <li>
            Clear the download cache under{" "}
            <Link href="/settings">Settings</Link> so the flagged Heated Metal
            files are fetched fresh instead of reused
          </li>
          <li>
            Download the season again and choose <strong>Heated Metal</strong>{" "}
            in the dialog to restore the files
          </li>
        </ol>
      </>
    ),
  },
  {
    q: "My antivirus deleted a game file. How do I get it back?",
    a: (
      <ol>
        <li>
          Add both your library folder and the Launcher install folder as
          exclusions in your antivirus settings
        </li>
        <li>
          If the file was part of Heated Metal, clear the download cache under{" "}
          <Link href="/settings">Settings</Link> so the flagged files are not
          reused
        </li>
        <li>
          Use <strong>Verify</strong> in the Launcher, or re-download the
          season, to restore the files
        </li>
      </ol>
    ),
  },
  {
    q: "I use a third-party antivirus. Does the same apply?",
    a: (
      <>
        <p>
          Yes. The process is essentially the same for all antivirus software.
          You need to add both your library folder and the Launcher install
          folder as exclusions. The exact steps vary by product, but look for an{" "}
          <strong>Exclusions</strong>, <strong>Exceptions</strong>, or{" "}
          <strong>Whitelist</strong> section in your antivirus settings.
        </p>
        <p>
          If you are unsure how to do it for your antivirus, search the
          internet for{" "}
          <code>[your antivirus name] add folder exclusion</code>.
        </p>
      </>
    ),
  },
];

export default function Antivirus() {
  return (
    <>
      <Hero
        tag="Troubleshooting"
        corner="AV"
        title={<em>Antivirus</em>}
        description="Common antivirus issues and how to resolve them, including false-positive detections."
      />
      <FaqAccordion items={faqs} />
    </>
  );
}
