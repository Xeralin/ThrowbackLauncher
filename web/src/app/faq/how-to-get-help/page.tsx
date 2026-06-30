import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { Callout } from "@/components/Callout";
import { ContentImage } from "@/components/ContentImage";
import { ExternalLink } from "@/components/ExternalLink";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "How To Get Help",
  description:
    "Cannot find an answer in the FAQ? Here is how to get support from the community and staff.",
  path: "/how-to-get-help",
});

export default function HowToGetHelp() {
  return (
    <>
      <Hero
        tag="Support"
        corner="HELP"
        title={<em>How To Get Help</em>}
        description="Cannot find an answer in the FAQ? Here is how to get support from the community and staff."
      />

      <SectionTitle>Reporting an Issue to Staff</SectionTitle>
      <Prose>
        <p>
          If your issue is not covered in the FAQ, post in the{" "}
          <ExternalLink href="https://discord.com/channels/1092820800203141130/1106957787516379267">
            help channel
          </ExternalLink>{" "}
          on the Operation Throwback Discord server. To get a fast and useful
          response, follow this structure when reporting:
        </p>

        <h3>Title</h3>
        <p>
          Write a short, clear title that summarizes the issue. This is used in
          your Discord post or thread.
        </p>

        <h3>Description</h3>
        <p>Describe the problem in detail, including:</p>
        <ul>
          <li>What you were doing when the issue occurred</li>
          <li>Any steps you have already tried</li>
          <li>Any error messages or unusual behavior</li>
        </ul>

        <h3>Screenshots</h3>
        <p>
          Attach screenshots where relevant. Use the built-in screenshot tool on
          your PC. Do <strong>NOT</strong> take photos of your screen with a
          phone.
        </p>

        <h3>Notifying Staff</h3>
        <p>
          After posting, ping the <strong>Helper</strong> role once to notify
          staff.
        </p>
        <Callout variant="warning" label="// WARNING">
          Only ping the Helper role once. Do not tag individual staff members or
          moderators directly. If you do, you will most likely be ignored or
          made fun of.
        </Callout>
      </Prose>

      <SectionTitle>Report Examples</SectionTitle>
      <Prose>
        <h3>Bad Example</h3>
        <ContentImage
          src="/media/others/bad-example.png"
          alt="Example of a bad report"
          width={1616}
          height={608}
        />
        <h3>Good Example</h3>
        <ContentImage
          src="/media/others/good-example.png"
          alt="Example of a good report"
          width={1074}
          height={841}
        />
      </Prose>
    </>
  );
}
