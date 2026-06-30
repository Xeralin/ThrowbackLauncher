import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { ExternalLink } from "@/components/ExternalLink";
import { withBasePath } from "@/lib/asset";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Common Errors",
  description:
    "Solutions to the most frequently encountered game issues and errors.",
  path: "/common-errors",
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
          <ExternalLink href="https://store.steampowered.com/app/359550/">
            R6S is free on Steam
          </ExternalLink>
          , so you can add it to your library at no cost. Once it is in your
          library the Launcher will work.
        </p>
      </>
    ),
  },
  {
    q: "Can I use controller / Why is my game stuck on controller input?",
    a: (
      <>
        <p>
          Controllers are supported out of the box. Simply plug in your
          controller and it should be detected automatically. Note that PS5
          (DualSense) controllers require additional third-party software (such
          as DS4Windows) to function properly.
        </p>
        <p>
          If your game is stuck on controller input, disconnect your controller
          if it is still connected, then restart the game.
        </p>
      </>
    ),
  },
  {
    q: "How do I fix the MSVCRXXX.dll error?",
    a: (
      <>
        <p>
          This error means your system is missing a required Microsoft Visual
          C++ Redistributable package. To fix it:
        </p>
        <ol>
          <li>
            Visit this{" "}
            <ExternalLink href="https://github.com/abbodi1406/vcredist/releases/latest">
              repository
            </ExternalLink>
          </li>
          <li>Download the ZIP file (not the source code)</li>
          <li>
            Extract the contents and run <code>install_all.bat</code> as
            administrator
          </li>
          <li>Restart your PC and try launching the game again</li>
        </ol>
        <p className="note">
          If the error persists, make sure Windows is fully up to date, then
          repeat the steps above.
        </p>
      </>
    ),
  },
  {
    q: "How do I fix the uplay_rx_loader64.dll error?",
    a: (
      <>
        <p>
          This error usually occurs when your antivirus has blocked or removed a
          required file.
        </p>
        <ol>
          <li>
            Add your R6S folder as an exclusion in your antivirus settings
          </li>
          <li>Re-apply the crack files to your R6S folder</li>
        </ol>
      </>
    ),
  },
  {
    q: "How do I fix missing or corrupt DLL files?",
    a: (
      <>
        <p>
          If you get an error mentioning any of the following files, the fix is
          the same for all of them:
        </p>
        <ul>
          <li>
            <code>amd_ags_x64.dll</code>
          </li>
          <li>
            <code>gfsdk_ssao_d3d11.win64.dll</code>
          </li>
          <li>
            <code>vivosxdk_x64.dll</code>
          </li>
          <li>
            <code>bink2w64.dll</code>
          </li>
        </ul>
        <ol>
          <li>Delete the specified .dll file from your R6S folder</li>
          <li>Use Verify in the Launcher to restore missing files</li>
        </ol>
      </>
    ),
  },
  {
    q: "My old R6S version opens the current version or Ubisoft Connect instead.",
    a: (
      <>
        <ol>
          <li>
            <strong>Check your antivirus</strong> — Crack files may be flagged
            and removed, so make sure your R6S folder has an exclusion set up
          </li>
          <li>
            <strong>Verify your files</strong> — Use Verify in the
            Launcher to restore the correct files
          </li>
          <li>
            <strong>Replace files</strong> — Copy the contents of the crack
            folder into your R6S folder, replacing existing files
          </li>
        </ol>
        <p>Once done, try launching the game again.</p>
      </>
    ),
  },
  {
    q: 'My game is stuck on "Preparing Content". How do I fix it?',
    a: (
      <>
        <ol>
          <li>
            <strong>Restart the game</strong> — Close it completely via Task
            Manager and try again
          </li>
          <li>
            <strong>Verify your files</strong> — Use Verify in the
            Launcher to check for missing or corrupted files
          </li>
          <li>
            <strong>Check your antivirus</strong> — If files were removed,
            exclude your R6S folder and re-apply the crack
          </li>
        </ol>
        <p className="note">
          This issue usually resolves itself after a restart. Verifying files is
          a reliable second step.
        </p>
      </>
    ),
  },
  {
    q: "Why is my .exe / launch file missing?",
    a: (
      <>
        <p>
          If the executable is missing, it is usually caused by your antivirus
          removing it. To fix it:
        </p>
        <ol>
          <li>
            Add your R6S folder as an exclusion in your antivirus settings
          </li>
          <li>
            Use Verify in the Launcher to re-download any missing files
          </li>
        </ol>
        <p className="note">
          If files keep going missing after verifying, double-check that your
          antivirus exclusion is set correctly before running Verify
          again.
        </p>
        <p>
          If verifying does not help, you may need SKU RUS. Visit the{" "}
          <Link href="/faq/getting-started">Getting Started page</Link> for more
          details.
        </p>
      </>
    ),
  },
  {
    q: "My game is in Russian. How do I switch to English?",
    a: (
      <>
        <p>
          If you installed the SKU RUS version and want to change the language:
        </p>
        <ol>
          <li>
            Download the{" "}
            <a
              href={withBasePath("/downloads/localization.lang")}
              download="localization.lang"
            >
              localization.lang
            </a>{" "}
            file
          </li>
          <li>Move it to your R6S folder, replacing the existing file</li>
          <li>Launch the game — it should now be in English</li>
        </ol>
        <p>
          If you are unsure whether you need SKU RUS, refer to the{" "}
          <Link href="/faq/getting-started">Getting Started page</Link>.
        </p>
      </>
    ),
  },
  {
    q: 'Why do I get a "User profile loading failed" error?',
    a: (
      <p>
        This error is expected and does not affect gameplay. Simply click{" "}
        <strong>OK</strong> and the game will continue as normal.
      </p>
    ),
  },
];

export default function CommonErrors() {
  return (
    <>
      <Hero
        tag="Troubleshooting"
        corner="ERR"
        title={<em>Common Errors</em>}
        description="Solutions to the most frequently encountered game issues and errors."
      />
      <FaqAccordion items={faqs} />
    </>
  );
}
