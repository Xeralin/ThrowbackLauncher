import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Callout } from "@/components/Callout";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { ContentVideo } from "@/components/ContentVideo";
import { ContentImage } from "@/components/ContentImage";
import { ExternalLink } from "@/components/ExternalLink";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Getting Started",
  description:
    "A step-by-step guide to downloading and playing an older season of Rainbow Six Siege with the Launcher.",
});

const faqs: FaqItem[] = [
  {
    q: "Why does the Launcher need my Steam login?",
    a: (
      <>
        <p>
          Your credentials are required to access the Steam depot servers, which
          is where the old game files are stored. The Launcher uses{" "}
          <ExternalLink href="https://github.com/SteamRE/DepotDownloader">
            DepotDownloader
          </ExternalLink>
          , an open-source tool, to fetch them.
        </p>
        <p className="note">
          Your password is never stored — the Launcher keeps only an encrypted
          access token, just like the Steam client.
        </p>
      </>
    ),
  },
  {
    q: "Are these files trojans or malware?",
    a: (
      <p>
        No. Your antivirus may flag the Launcher or the downloaded game files
        because they are not signed by a verified developer, since obtaining a
        code-signing certificate requires a significant financial investment.
        The game files come straight from Steam&apos;s own depot servers.
      </p>
    ),
  },
  {
    q: "How do I change my username?",
    a: (
      <>
        <p>
          Open <strong>Settings &gt; Account</strong> in the Launcher and edit
          the <strong>Username</strong> field (max 16 characters). The change is
          saved automatically.
        </p>
        <p className="note">
          Set your username before launching the game so it applies in-game.
        </p>
      </>
    ),
  },
  {
    q: "How do I set up the Discord presence?",
    a: (
      <>
        <p>
          The Launcher can show the season you are playing as a Discord
          activity. It runs through your own Discord application, so the
          activity carries your name and images:
        </p>
        <ol>
          <li>
            Open{" "}
            <ExternalLink href="https://discord.com/developers/applications">
              discord.com/developers/applications
            </ExternalLink>{" "}
            and click <strong>New Application</strong> — the application name is
            what Discord shows as the activity
          </li>
          <li>
            Copy the <strong>Application ID</strong> from{" "}
            <em>General Information</em>
          </li>
          <li>
            In the Launcher, open <strong>Settings &gt; Discord</strong>, enable{" "}
            <strong>Discord presence</strong> and paste the Application ID
          </li>
          <li>
            Optional: upload images under <em>Rich Presence &gt; Art Assets</em>{" "}
            in your Discord application, then enter their asset names in the{" "}
            <strong>Large image</strong> and <strong>Small image</strong> fields
          </li>
          <li>
            Optional: fill <strong>Title</strong>, <strong>State</strong> and up
            to two buttons — text fields understand{" "}
            <strong>{"{season_name}"}</strong> and{" "}
            <strong>{"{season_code}"}</strong> placeholders
          </li>
        </ol>
        <p className="note">
          The presence appears automatically while a season is running and
          disappears when you close the game.
        </p>
      </>
    ),
  },
  {
    q: "What does Verify do?",
    a: (
      <p>
        On an installed season the Launcher shows a <strong>Verify</strong>{" "}
        button. It checks for missing or corrupted files and re-downloads
        anything that needs fixing, repairing the install in place without
        deleting your existing files.
      </p>
    ),
  },
  {
    q: "Can I pause and resume a download?",
    a: (
      <p>
        Yes. Press <strong>Cancel</strong> at any point, or simply close the
        Launcher. When you come back to the same season, the button becomes{" "}
        <strong>Continue download</strong> — the Launcher verifies what you
        already have and resumes from where it left off.
      </p>
    ),
  },
  {
    q: "I am getting errors while downloading. What should I do?",
    a: (
      <>
        <p>
          Most errors during download do not affect the final result and can be
          ignored. For specific errors:
        </p>
        <ul>
          <li>
            <strong>Encountered error downloading chunk XXXXXX</strong> — Safe
            to ignore. The Steam servers were briefly unreachable and the
            Launcher retries automatically
          </li>
          <li>
            <strong>Depot XXXXX is not available</strong> — You do not own R6S
            on Steam, or you need to use the SKU RUS option
          </li>
          <li>
            <strong>Failed to allocate file</strong> — Free up storage space on
            the install drive
          </li>
          <li>
            <strong>Another process is using XXX</strong> — Close any program
            that might be interfering, such as your antivirus or another game
            instance
          </li>
        </ul>
      </>
    ),
  },
  {
    q: "Can I install a season to a different drive?",
    a: (
      <>
        <p>
          The Launcher manages where seasons are stored and installs each one to
          its own folder. There is no per-season drive picker — pick where the
          Launcher lives when you set it up, and seasons install alongside it.
        </p>
        <p className="note">
          If you are low on space, check <strong>Disk usage</strong> under{" "}
          <strong>Settings &gt; Downloads</strong> and use{" "}
          <strong>Clear cache</strong> there to reclaim room.
        </p>
      </>
    ),
  },
  {
    q: "How do I delete a season?",
    a: (
      <p>
        Open the season in the Launcher and press <strong>Uninstall</strong>.
        The Launcher removes the season&apos;s files for you. If the game is
        still running, close it first.
      </p>
    ),
  },
  {
    q: "Do I need the current season of R6S installed?",
    a: (
      <p>
        No. Each season the Launcher installs is completely independent and runs
        on its own, like a separate game.
      </p>
    ),
  },
  {
    q: "What is SKU RUS and do I need it?",
    a: (
      <>
        <p>
          Some Steam accounts from post-USSR countries require a different
          regional version of the game. If your account is from one of the
          affected regions (shown in the image below), select the SKU RUS option
          when the Launcher downloads the season.
        </p>
        <p>
          The SKU RUS version is in Russian by default. To change the language,
          download the{" "}
          <a href="/downloads/localization.lang" download="localization.lang">
            localization.lang
          </a>{" "}
          file and place it in the season&apos;s folder.
        </p>
        <ContentImage
          src="/media/others/sku-rus.avif"
          alt="SKU RUS regions map"
          width={768}
          height={112}
        />
      </>
    ),
  },
];

export default function GettingStarted() {
  return (
    <>
      <Hero
        tag="Setup Guide"
        corner="SETUP"
        title={<em>Getting Started</em>}
        description="A step-by-step guide to downloading and playing an older season of Rainbow Six Siege with the Launcher."
      />

      <Callout label="// STEAM REQUIRED">
        This only works if you own R6S on Steam. Ubisoft Connect and Epic Games
        accounts are not supported.
      </Callout>

      <SectionTitle>Step 1 — Add an Antivirus Exclusion</SectionTitle>
      <Prose>
        <p>
          Before downloading, add the Launcher&apos;s install location as an
          exclusion in Windows Security so your antivirus does not interfere
          with the game files:
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
            <strong>Folder</strong>, and choose the Launcher&apos;s folder
          </li>
        </ol>
        <ContentVideo
          src="/media/antivirus-exclusion.webm"
          label="Adding an antivirus exclusion"
          width={1920}
          height={1080}
        />
      </Prose>

      <SectionTitle>Step 2 — Pick a Season</SectionTitle>
      <Prose>
        <p>
          Open the Launcher, sign in with your Steam account, and browse the
          available seasons. Select the one you want and press{" "}
          <strong>Download</strong>. The Launcher fetches it straight from
          Steam&apos;s depot servers and sets everything up for you.
        </p>
      </Prose>

      <SectionTitle>Step 3 — Play</SectionTitle>
      <Prose>
        <p>
          Press <strong>Play</strong> in the Launcher to launch the game. On
          Linux, the first time you also press <strong>Add to Steam</strong> —
          after that, Play works the same as on Windows.
        </p>
      </Prose>

      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <FaqAccordion items={faqs} />

      <SectionTitle>Need Help?</SectionTitle>
      <Prose>
        <p>
          If you run into issues, check the{" "}
          <Link href="/faq/common-errors">Common Errors</Link> page or visit the{" "}
          <Link href="/faq/how-to-get-help">How To Get Help</Link> page for
          guidance on reporting problems to staff.
        </p>
      </Prose>
    </>
  );
}
