import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { display, mono, body } from "./fonts";
import { baseMetadata } from "@/lib/metadata";
import { site } from "@/config/site";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = baseMetadata;

export const viewport: Viewport = {
  themeColor: site.themeColor,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} ${body.variable}`}
    >
      <body>
        <Script src="/bridge-init.js" strategy="afterInteractive" />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
