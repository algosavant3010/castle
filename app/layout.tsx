import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://blitz-app.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Blitz - Secure autonomy for the agent economy on Monad",
    template: "%s | Blitz",
  },
  description:
    "Let agents transact. Keep your funds untouchable. Time-boxed session keys, on-chain spend limits, and pre-sign simulation on Monad.",
  keywords: [
    "Blitz",
    "Monad",
    "AI agents",
    "session keys",
    "on-chain security",
    "agent economy",
    "DeFi",
    "smart contract wallet",
    "spend limits",
    "blockchain autonomy",
  ],
  authors: [{ name: "Blitz" }],
  creator: "Blitz",
  publisher: "Blitz",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/castle.svg",
    shortcut: "/castle.svg",
    apple: "/castle.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Blitz",
    title: "Blitz - Secure autonomy for the agent economy on Monad",
    description:
      "Let agents transact. Keep your funds untouchable. Time-boxed session keys, on-chain spend limits, and pre-sign simulation on Monad.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blitz - Secure autonomy for the agent economy on Monad",
    description:
      "Let agents transact. Keep your funds untouchable. Time-boxed session keys, on-chain spend limits, and pre-sign simulation on Monad.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        {children}
      </body>
    </html>
  );
}
