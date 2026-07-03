import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { SeasonTable } from "@/components/SeasonTable";
import {
  SUPPORTED_Y12,
  SUPPORTED_Y34,
  UNLOCK_ALL_SEASONS,
} from "@/config/liberator-builds";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { ExternalLink } from "@/components/ExternalLink";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Liberator",
  description:
    "Unlock all cosmetics and play additional game modes in older Rainbow Six Siege seasons.",
});

const faqs: FaqItem[] = [
  {
    q: "Windows Security is blocking Liberator, what do I do?",
    a: (
      <p>
        Liberator is bundled with the Launcher, so there is nothing to download
        separately. If your antivirus flags it as a false positive, add the
        Launcher&#39;s install folder as an exclusion, then use{" "}
        <strong>Verify</strong> in the Launcher to restore any removed files.
        See the <Link href="/faq/antivirus">Antivirus</Link> page for the full
        steps.
      </p>
    ),
  },
  {
    q: "Liberator is crashing the game, how do I fix it?",
    a: (
      <p>
        Make sure to launch Liberator <strong>before</strong> launching the
        game. If the game is still crashing, verify that it is fully closed,
        check Task Manager and end any remaining R6S processes before trying
        again.
      </p>
    ),
  },
  {
    q: "It says my build is unsupported, what does that mean?",
    a: (
      <p>
        Liberator only supports specific game builds. All supported builds are
        listed in the <strong>Supported seasons</strong> section above.
      </p>
    ),
  },
  {
    q: "The game crashes when playing Terrorist Hunt or the Outbreak event with other players.",
    a: (
      <p>
        The order of operations matters here. Create the local custom game first
        and have other players join before selecting the game mode. Make sure
        everyone is on the <strong>blue team</strong> before starting.
      </p>
    ),
  },
];

export default function Liberator() {
  return (
    <>
      <Hero
        tag="Tools & Mods"
        corner="LIB"
        title={<em>Liberator</em>}
        description="Unlock all cosmetics and play additional game modes in older Rainbow Six Siege seasons."
      />

      <SectionTitle>What is Liberator?</SectionTitle>
      <Prose>
        <p>
          Liberator unlocks extra possibilities in Rainbow Six Siege local
          custom games. It cannot be used to cheat on live servers, and never
          will be.
        </p>
        <p>
          The Launcher bundles and manages Liberator for you, so there is
          nothing to download or install by hand. It is the same build published
          to the official{" "}
          <ExternalLink href="https://github.com/Xeralin/Liberator">
            repository
          </ExternalLink>
          .
        </p>
      </Prose>

      <SectionTitle>How to Use Liberator</SectionTitle>
      <Prose>
        <h3>Enabling it</h3>
        <ol>
          <li>
            Open the <strong>Liberator</strong> tab in the Launcher
          </li>
          <li>Pick the build that matches the season you are playing</li>
          <li>
            Enable Liberator, then launch the game from the Launcher — all
            cosmetics should be available
          </li>
        </ol>

        <h3>Custom game</h3>
        <ol>
          <li>
            Enable Liberator in its tab <strong>before</strong> launching the
            game
          </li>
          <li>Create a local custom game</li>
          <li>
            Double-click the game mode in the Liberator menu — text appears at
            the bottom of the window if it worked
          </li>
          <li>
            If you want to play Terrorist Hunt or the Outbreak event, make sure
            you are on the <strong>blue team</strong>, then start the game
          </li>
        </ol>
      </Prose>

      <SectionTitle>Supported seasons</SectionTitle>
      <Prose>
        <div className="flex flex-wrap items-start gap-x-6">
          <SeasonTable rows={SUPPORTED_Y12} />
          <SeasonTable rows={SUPPORTED_Y34} showEvent />
          <SeasonTable
            caption="Unlock All"
            className="self-end"
            rows={UNLOCK_ALL_SEASONS}
          />
        </div>
      </Prose>

      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <FaqAccordion items={faqs} />
    </>
  );
}
