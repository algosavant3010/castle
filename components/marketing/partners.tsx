"use client";

/**
 * Partners / Ecosystem - Scroll-velocity-driven infinite marquee with partner icons.
 * Uses the ScrollVelocity component from React Bits for physics-based scroll animation.
 */

import Image from "next/image";
import ScrollVelocity from "@/components/reactbits/interactions/ScrollVelocity";

const PARTNERS = [
  { name: "Monad", src: "/monad.svg" },
  { name: "Chainlink", src: "/chainlink.svg" },
  { name: "Uniswap", src: "/uniswap.svg" },
  { name: "Pyth", src: "/pyth.svg" },
  { name: "Wormhole", src: "/wormhole.svg" },
  { name: "n8n", src: "/n8n.svg" },
  { name: "Ethereum", src: "/ethereum.svg" },
  { name: "Phantom", src: "/phantom.svg" },
  { name: "Ledger", src: "/ledger.svg" },
  { name: "Kraken", src: "/kraken.svg" },
  { name: "CowSwap", src: "/cowswap.svg" },
  { name: "Arbitrum", src: "/arbitrum-one.svg" },
  { name: "1inch", src: "/1inch.svg" },
  { name: "Polygon", src: "/matic.svg" },
  { name: "Axelar", src: "/axl.svg" },
  { name: "OKX", src: "/okx.svg" },
  { name: "Optimism", src: "/op.svg" },
  { name: "Solana", src: "/sol.svg" },
  { name: "Tron", src: "/trx.svg" },
  { name: "World", src: "/world.svg" },
];

function PartnerIcon({ name, src }: { name: string; src: string }) {
  return (
    <div
      className="inline-flex shrink-0 items-center justify-center w-16 h-16 mx-8 opacity-40 transition-all duration-300 hover:opacity-100 hover:scale-110 hover:drop-shadow-[0_0_12px_rgba(131,110,249,0.6)]"
      title={name}
    >
      <Image
        src={src}
        alt={name}
        width={64}
        height={64}
        className="w-16 h-16 object-contain brightness-0 invert"
      />
    </div>
  );
}

export function Partners() {
  // Split partners into 3 rows for triple-marquee effect
  const third = Math.ceil(PARTNERS.length / 3);
  const row1Partners = PARTNERS.slice(0, third);
  const row2Partners = PARTNERS.slice(third, third * 2);
  const row3Partners = PARTNERS.slice(third * 2);

  const row1 = (
    <div className="flex items-center">
      {row1Partners.map((p) => (
        <PartnerIcon key={p.name} name={p.name} src={p.src} />
      ))}
    </div>
  );

  const row2 = (
    <div className="flex items-center">
      {row2Partners.map((p) => (
        <PartnerIcon key={p.name} name={p.name} src={p.src} />
      ))}
    </div>
  );

  const row3 = (
    <div className="flex items-center">
      {row3Partners.map((p) => (
        <PartnerIcon key={p.name} name={p.name} src={p.src} />
      ))}
    </div>
  );

  return (
    <section className="relative py-24 md:py-32">
      {/* Background glow accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full opacity-20 blur-3xl motion-reduce:hidden"
        style={{
          background:
            "radial-gradient(ellipse, rgba(131, 110, 249, 0.2) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-6 md:px-12">
        <p className="mb-12 text-center text-[14px] font-medium tracking-wide text-muted/70">
          Integrated with leading protocols
        </p>
      </div>

      {/* ScrollVelocity marquee - 3 rows */}
      <div className="relative overflow-hidden">
        {/* Gradient edge masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-bg via-bg/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-bg via-bg/80 to-transparent" />

        <ScrollVelocity
          texts={[row1, row2, row3]}
          velocity={40}
          numCopies={5}
          damping={50}
          stiffness={400}
          className="inline-flex items-center"
          parallaxClassName="parallax py-3"
          scrollerClassName="scroller"
          scrollerStyle={{ alignItems: "center" }}
        />
      </div>
    </section>
  );
}
