import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Callout } from "@/components/Callout";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { ExternalLink } from "@/components/ExternalLink";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Multiplayer",
  description: "How to set up and play with others using RadminVPN.",
});

const faqs: FaqItem[] = [
  {
    q: "Does it matter who hosts the game?",
    a: (
      <p>
        Yes. The player with the most stable internet connection should host. If
        you are experiencing lag, try switching hosts.
      </p>
    ),
  },
  {
    q: "I cannot find the hosted game. What should I check?",
    a: (
      <ol>
        <li>
          <strong>Check your game version</strong> — Both players must be on the
          same build (enable <em>Show Metrics</em> in the game settings to see
          the build number)
        </li>
        <li>
          <strong>Check your RadminVPN network</strong> — Make sure both players
          are connected to the same network
        </li>
        <li>
          <strong>Check your firewall</strong> — Make sure the old R6S build is
          allowed through your firewall for both private and public networks
        </li>
        <li>
          <strong>Restart</strong> — Try restarting both the game and RadminVPN
        </li>
      </ol>
    ),
  },
  {
    q: "Can I use a different VPN instead of RadminVPN?",
    a: (
      <p>
        Yes, alternatives like{" "}
        <ExternalLink href="https://www.zerotier.com/">ZeroTier</ExternalLink>{" "}
        work. However, RadminVPN is recommended because it supports more
        simultaneous connections per network. If you use a different VPN, we
        will not provide any support for any issues you may encounter.
      </p>
    ),
  },
];

export default function Multiplayer() {
  return (
    <>
      <Hero
        tag="Setup Guide"
        corner="MP"
        title={<em>Multiplayer</em>}
        description="How to set up and play with others using RadminVPN."
      />

      <Callout label="// NOTE">
        This guide assumes the Launcher has already installed a season.
      </Callout>

      <SectionTitle>Basic Setup</SectionTitle>
      <Prose>
        <p>
          To play with others, everyone needs to be connected to the same{" "}
          <strong>RadminVPN</strong> network.
        </p>
        <ol>
          <li>
            Download and install{" "}
            <ExternalLink href="https://www.radmin-vpn.com/">
              RadminVPN
            </ExternalLink>{" "}
          </li>
          <li>
            Create a network in RadminVPN or join one that your friends are
            already in
          </li>
          <li>Make sure all players are connected to the same network</li>
          <li>
            Launch the game and create a <strong>Local Custom Game</strong>
          </li>
          <li>
            Other players can join by selecting <strong>Join Local</strong> from
            the main menu
          </li>
        </ol>
      </Prose>

      <SectionTitle>On Linux</SectionTitle>
      <Prose>
        <p>
          On Linux the game runs through Proton, but RadminVPN itself needs
          Windows. The Launcher bridges a Windows VM into your host network:
        </p>
        <ol>
          <li>Create a Windows VM in VirtualBox and install RadminVPN on it</li>
          <li>
            Open <Link href="/settings/bridge">Bridge Settings</Link> and
            create the bridge with your RadminVPN IP
          </li>
          <li>Shut the VM down, then attach it to the bridge</li>
          <li>In Windows, bridge the Ethernet 2 and Radmin VPN adapters</li>
        </ol>
      </Prose>

      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <FaqAccordion items={faqs} />
    </>
  );
}
