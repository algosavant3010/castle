"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const VIDEOS = [
  {
    id: "1206417293",
    label: "Session keys",
  },
  {
    id: "1206417292",
    label: "Pre-sign simulation",
  },
  {
    id: "1206417291",
    label: "Shield enforcement",
  },
];

export function VideoShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !gridRef.current) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cells = gridRef.current!.querySelectorAll(".vid-cell");
        gsap.fromTo(
          cells,
          { opacity: 0, y: 30, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-12">
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {VIDEOS.map((video) => (
            <div
              key={video.id}
              className="vid-cell relative aspect-video rounded-2xl overflow-hidden border border-white/[0.04] bg-[#0a0a0c]"
            >
              <iframe
                src={`https://player.vimeo.com/video/${video.id}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`}
                allow="autoplay; fullscreen"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                style={{ border: "none" }}
                loading="lazy"
                title={video.label}
              />
              {/* Bottom label */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
                <span className="font-mono text-[10px] text-white/40 tracking-wide uppercase">
                  {video.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
