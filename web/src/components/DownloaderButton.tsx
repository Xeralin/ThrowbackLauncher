import type { ReactNode } from "react";
import { buttonBase, buttonVariants } from "./Button";
import { ExternalLink } from "./ExternalLink";

export function DownloaderButton({
  href,
  secondary,
  download,
  children,
}: {
  href: string;
  secondary?: boolean;
  download?: string;
  children: ReactNode;
}) {
  const className = `${buttonBase} mb-[0.4rem] mr-2 no-underline ${secondary ? buttonVariants.secondary : buttonVariants.primary}`;
  if (download) {
    return (
      <a href={href} download={download} className={className}>
        {children}
      </a>
    );
  }
  return (
    <ExternalLink href={href} className={className}>
      {children}
    </ExternalLink>
  );
}
