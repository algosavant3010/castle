"use client";

import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-bg">
      {/* Ambient top gradient glow */}
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 h-[600px] z-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(131,110,249,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        {children}
        <Footer />
      </div>
    </div>
  );
}
