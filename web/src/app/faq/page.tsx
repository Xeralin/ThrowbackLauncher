import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { StatsRow } from "@/components/StatsRow";
import { Callout } from "@/components/Callout";
import { SectionTitle } from "@/components/SectionTitle";
import { CardGrid, NavCard } from "@/components/NavCard";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description:
    "Your guide to setting up, downloading, and playing older Rainbow Six Siege seasons with the Launcher.",
});

export default function Faq() {
  return (
    <>
      <Hero
        tag="Operation Throwback"
        corner="R6S"
        title={
          <>
            Welcome to the <em>Throwback FAQ</em>
          </>
        }
        description="Your guide to setting up, downloading, and playing older Rainbow Six Siege seasons with the Launcher."
      />

      <div className="mb-8 grid grid-cols-[minmax(0,520px)_1fr] gap-4 max-[64em]:grid-cols-1">
        <StatsRow />
        <Callout label="// NOTE" className="mb-0">
          Not all questions and issues are covered in this FAQ. Content is
          regularly updated and expanded as new issues come up.
        </Callout>
      </div>

      <SectionTitle>Quick Start</SectionTitle>
      <CardGrid>
        <NavCard
          href="/faq/getting-started"
          title="Getting Started"
          desc="New here? Follow the step-by-step guide to set up and download seasons with the Launcher."
          arrow="— START HERE"
        />
        <NavCard
          href="/faq/multiplayer"
          title="Multiplayer"
          desc="Play with friends using RadminVPN or ZeroTier."
          arrow="— LEARN MORE"
        />
      </CardGrid>

      <SectionTitle>Support & Troubleshooting</SectionTitle>
      <CardGrid>
        <NavCard
          href="/faq/common-errors"
          title="Common Errors"
          desc="Crashes, missing files, DLL errors, and other frequent issues with known fixes."
          arrow="— FIX ISSUES"
        />
        <NavCard
          href="/faq/antivirus"
          title="Antivirus"
          desc="Common antivirus issues and how to fix them, including false-positive detections."
          arrow="— READ MORE"
        />
        <NavCard
          href="/faq/how-to-get-help"
          title="How To Get Help"
          desc="Cannot find your answer here? Learn how to report issues to staff effectively."
          arrow="— GET HELP"
        />
      </CardGrid>

      <SectionTitle>Tools & Mods</SectionTitle>
      <CardGrid>
        <NavCard
          href="/faq/liberator"
          title="Liberator"
          desc="Unlock all cosmetics and play additional game modes in older Rainbow Six Siege seasons."
          arrow="— LEARN MORE"
        />
        <NavCard
          href="/faq/heated-metal"
          title="Heated Metal"
          desc="An SDK for R6S — map editor, scripting, unlock all, and more."
          arrow="— LEARN MORE"
        />
        <NavCard
          href="/faq/cheat-engine"
          title="Cheat Engine"
          desc="Modify Terrorist Hunt with Cheat Engine tables."
          arrow="— LEARN MORE"
        />
      </CardGrid>

      <SectionTitle>Community</SectionTitle>
      <CardGrid>
        <NavCard
          href="/faq/extended-rules"
          title="Extended Rules"
          desc="The full Operation Throwback Discord server rules — what is expected of every member."
          arrow="— READ RULES"
        />
        <NavCard
          href="/faq/credits"
          title="Credits"
          desc="The staff and contributors behind Operation Throwback and this FAQ."
          arrow="— VIEW CREDITS"
        />
      </CardGrid>
    </>
  );
}
