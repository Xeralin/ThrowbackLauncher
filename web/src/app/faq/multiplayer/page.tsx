import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { ExternalLink } from "@/components/ExternalLink";
import { OnLinux } from "@/components/OnLinux";
import { OnWindows } from "@/components/OnWindows";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Multiplayer",
  description: "How to set up and play with others using RadminVPN or ZeroTier.",
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
          same build. Installing the same season through the Launcher
          guarantees this. To confirm it in game, enable{" "}
          <strong>Show Metrics</strong> in the game settings to see the build
          number
        </li>
        <li>
          <strong>Check your VPN network</strong> — Make sure both players
          are connected to the same network
        </li>
        <li>
          <strong>Check your firewall</strong> — Make sure the old R6S build is
          allowed through your firewall
          <OnWindows> for both private and public networks</OnWindows>
        </li>
        <li>
          <strong>Restart</strong> — Try restarting both the game and your VPN
        </li>
      </ol>
    ),
  },
  {
    q: "Can I use a different VPN?",
    a: (
      <p>
        Yes, other VPNs can work too. We only support RadminVPN and ZeroTier,
        so we cannot help if a different one gives you trouble.
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
        description="How to set up and play with others using RadminVPN or ZeroTier."
      />

      <SectionTitle>RadminVPN Setup</SectionTitle>
      <Prose>
        <ol>
          <OnWindows>
            <li>
              Download and install{" "}
              <ExternalLink href="https://www.radmin-vpn.com/">
                RadminVPN
              </ExternalLink>
            </li>
          </OnWindows>
          <OnLinux>
            <li>
              Create a Windows VM in VirtualBox and install{" "}
              <ExternalLink href="https://www.radmin-vpn.com/">
                RadminVPN
              </ExternalLink>{" "}
              on it
            </li>
            <li>
              Open <Link href="/settings/bridge">Bridge</Link> in the Settings
              and create the bridge with your RadminVPN IP
            </li>
            <li>Shut the VM down, then attach it to the bridge</li>
            <li>
              In Windows, bridge the <strong>Ethernet 2</strong> and{" "}
              <strong>Radmin VPN</strong> adapters
            </li>
          </OnLinux>
          <li>
            Create a network in RadminVPN or join one that your friends are
            already in
          </li>
        </ol>
      </Prose>

      <SectionTitle>ZeroTier Setup</SectionTitle>
      <Prose>
        <ol>
          <OnWindows>
            <li>
              Download and run the{" "}
              <ExternalLink href="https://www.zerotier.com/download/">
                ZeroTier MSI installer
              </ExternalLink>
            </li>
          </OnWindows>
          <OnLinux>
            <li>
              Install ZeroTier with{" "}
              <code>curl -s https://install.zerotier.com | sudo bash</code>
            </li>
          </OnLinux>
          <li>
            Create a network at{" "}
            <ExternalLink href="https://central.zerotier.com">
              central.zerotier.com
            </ExternalLink>{" "}
            or use the network ID of your friends
          </li>
          <OnWindows>
            <li>
              Right-click the ZeroTier tray icon, choose{" "}
              <strong>Join Network</strong> and enter the network ID
            </li>
          </OnWindows>
          <OnLinux>
            <li>
              Join it with <code>sudo zerotier-cli join [network id]</code>
            </li>
          </OnLinux>
          <li>
            The network owner authorizes each new member under{" "}
            <strong>Members</strong> in ZeroTier Central
          </li>
        </ol>
      </Prose>

      <SectionTitle>How to Play</SectionTitle>
      <Prose>
        <ol>
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

      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <FaqAccordion items={faqs} />
    </>
  );
}
