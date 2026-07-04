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
      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        {children}
        <Footer />
      </div>
    </div>
  );
}
