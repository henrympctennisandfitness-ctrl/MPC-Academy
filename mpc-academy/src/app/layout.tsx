import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { RootShell } from "@/components/layout/RootShell";
import { APP } from "@/lib/config";
import "./globals.css";

// Premium, highly legible variable font. Exposed as a CSS variable so Tailwind
// can pick it up (see tailwind.config.ts fontFamily.sans).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP.name,
    template: `%s · ${APP.name}`,
  },
  description: APP.description,
};

// Mobile-first: sensible viewport + brand theme colour for the browser chrome.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E4D3A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // AUTH (future): wrap the returned tree in your auth provider when
  // reintroducing real authentication.
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background font-sans text-ink">
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
