import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Callout } from "@/components/Callout";
import { Note } from "@/components/Note";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { ExternalLink } from "@/components/ExternalLink";
import { OnLinux } from "@/components/OnLinux";
import { OnWindows } from "@/components/OnWindows";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Getting Started",
  description:
    "A step-by-step guide to downloading and playing an older season of Rainbow Six Siege with the Launcher.",
});

const faqs: FaqItem[] = [
  {
    q: "I do not own R6S on Steam. Can I use my Ubisoft or Epic Games account?",
    a: (
      <>
        <p>
          No. The Launcher uses the Steam depot service to download old game
          seasons from the Steam servers. This requires a valid Steam account
          with a registered license for R6S. Ubisoft Connect and Epic Games
          accounts cannot be used to authenticate with the Steam servers.
        </p>
        <p>
          <strong>R6S is free on Steam</strong> — add it to your Steam library
          on its{" "}
          <ExternalLink href="https://store.steampowered.com/app/359550/">
            store page
          </ExternalLink>{" "}
          and the Launcher will work.
        </p>
      </>
    ),
  },
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
          , an open-source tool.
        </p>
        <Note className="mt-3">
          Your password is never stored — the Launcher keeps only a login
          token, just like the Steam client.
        </Note>
      </>
    ),
  },
  {
    q: "How do I change my username?",
    a: (
      <>
        <p>
          Open the <Link href="/settings">Settings</Link> in the Launcher and
          edit the <strong>Username</strong> field (max 16 characters). The
          change is saved automatically.
        </p>
        <Note className="mt-3">
          Set your username before launching the game so it applies in-game.
        </Note>
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
          activity carries your name and images.
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
            In the Launcher, open <Link href="/settings/rpc">Discord RPC</Link>{" "}
            in the Settings, enable <strong>Discord presence</strong> and paste
            the Application ID
          </li>
          <li>
            In the <strong>Details</strong> field, enter a token to show the
            running season — <code>[season]</code> gives the full name,{" "}
            <code>[code]</code> the code, and <code>[operation]</code> the
            operation. The same tokens work in the <strong>State</strong> line
          </li>
          <li>
            To decorate it further, upload images under <em>Art Assets</em> in
            the <em>Rich Presence</em> section and enter their asset names in
            the <strong>Large image</strong> and <strong>Small image</strong>{" "}
            fields, and add up to two buttons with a label and a URL
          </li>
        </ol>
        <Note className="mt-3">
          The presence appears automatically while a season is running and
          disappears when you close the game.
        </Note>
      </>
    ),
  },
  {
    q: "What does Verify do?",
    a: (
      <p>
        On an installed season the <strong>Manage</strong> tab shows a{" "}
        <strong>Verify</strong> button. It checks for missing or corrupted
        files and re-downloads them, repairing the install in place without
        deleting your existing files.
      </p>
    ),
  },
  {
    q: "Can I pause and resume a download?",
    a: (
      <p>
        Yes. Press <strong>Pause</strong> at any point. When you come back to
        the same season, the button shows <strong>Continue download</strong> —
        the Launcher verifies what you already have and resumes from where it
        left off. If you close the Launcher during a download, it resumes
        automatically the next time you start it.
      </p>
    ),
  },
  {
    q: "Can I install a season to a different drive?",
    a: (
      <>
        <p>
          Yes. Seasons install into libraries — folders that can live on any
          drive. Open the <Link href="/settings">Settings</Link>, press{" "}
          <strong>Add library</strong> to add a folder, and use the star to
          make it the default. When more than one library exists, the Launcher
          asks which one to use before each download.
        </p>
        <Note className="mt-3">
          If you are low on space, check <strong>Disk usage</strong> in the{" "}
          <Link href="/settings">Settings</Link> and use{" "}
          <strong>Clear cache</strong> there to reclaim room.
        </Note>
      </>
    ),
  },
  {
    q: "How do I delete a season?",
    a: (
      <p>
        Open the season in the Launcher, switch to the <strong>Manage</strong>{" "}
        tab, and press <strong>Uninstall</strong>. The Launcher removes the
        season files for you. If the game is still running, close it first.
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

      <OnWindows>
        <SectionTitle>Step 1 — Add an Antivirus Exclusion</SectionTitle>
        <Prose>
          <p>
            Add the Launcher install folder at{" "}
            <code>%LOCALAPPDATA%\ThrowbackLauncher</code> as an exclusion in
            your antivirus before downloading, so it does not interfere with
            the game files. If you later add a library on another drive,
            exclude that folder as well. The{" "}
            <Link href="/faq/antivirus">Antivirus page</Link> has the
            step-by-step instructions.
          </p>
        </Prose>
      </OnWindows>

      <SectionTitle>
        Step <OnWindows>2</OnWindows>
        <OnLinux>1</OnLinux> — Pick a Season
      </SectionTitle>
      <Prose>
        <p>
          Browse the available seasons and press <strong>Download</strong> on
          the one you want — on your first download the Launcher asks you to
          sign in with your Steam account. It then fetches the season straight
          from the Steam depot servers and sets everything up for you.
        </p>
      </Prose>

      <SectionTitle>
        Step <OnWindows>3</OnWindows>
        <OnLinux>2</OnLinux> — Play
      </SectionTitle>
      <Prose>
        <p>
          Press <strong>Play</strong> in the Launcher to launch the game.
          <OnLinux>
            {" "}
            The first time a season shows <strong>Add to Steam</strong> instead
            — close Steam completely before you press it, then{" "}
            <strong>Play</strong> appears.
          </OnLinux>
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
