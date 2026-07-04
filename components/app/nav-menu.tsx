"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap } from "gsap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./nav-menu.css";

// ─── Types ─────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavMenuContextValue {
  open: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
  iconRef: RefObject<HTMLSpanElement | null>;
  textInnerRef: RefObject<HTMLSpanElement | null>;
  toggleBtnRef: RefObject<HTMLButtonElement | null>;
  textLines: string[];
}

// ─── Nav Items ─────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { href: "/wallets", label: "Wallets", icon: "M12 2a2 2 0 012 2v1h3a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h3V4a2 2 0 012-2zM9 12h.01M15 12h.01" },
  { href: "/marketplace", label: "Marketplace", icon: "M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM3 9l2.45-4.9A2 2 0 017.24 3h9.52a2 2 0 011.79 1.1L21 9" },
  { href: "/activity", label: "Activity", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { href: "/settings", label: "Settings", icon: "M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2zM12 15a3 3 0 100-6 3 3 0 000 6z" },
];

// ─── Context ───────────────────────────────────────────────

const NavMenuContext = createContext<NavMenuContextValue | null>(null);

export function useNavMenu() {
  const ctx = useContext(NavMenuContext);
  if (!ctx) throw new Error("useNavMenu must be used within NavMenuProvider");
  return ctx;
}

// ─── Provider ──────────────────────────────────────────────

export function NavMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const textInnerRef = useRef<HTMLSpanElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(false);
  const [textLines, setTextLines] = useState(["Menu", "Close"]);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    if (openRef.current) {
      doClose();
    }
  }, [pathname]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;

      if (!panel || !icon || !textInner) return;

      gsap.set(panel, { xPercent: 100, opacity: 1 });
      if (preContainer) {
        const layers = preContainer.querySelectorAll(".nav-prelayer");
        gsap.set(layers, { xPercent: 100, opacity: 1 });
      }
      gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });
      gsap.set(textInner, { yPercent: 0 });
    });
    return () => ctx.revert();
  }, []);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;

    const panel = panelRef.current;
    const preContainer = preLayersRef.current;
    if (!panel) { busyRef.current = false; return; }

    const layers = preContainer
      ? Array.from(preContainer.querySelectorAll<HTMLElement>(".nav-prelayer"))
      : [];
    const itemEls = Array.from(panel.querySelectorAll<HTMLElement>(".nav-panel-item-label"));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 120, rotate: 6 });

    const tl = gsap.timeline({ onComplete: () => { busyRef.current = false; } });

    layers.forEach((layer, i) => {
      tl.fromTo(layer, { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: "power4.out" }, i * 0.06);
    });

    const panelStart = layers.length ? (layers.length - 1) * 0.06 + 0.08 : 0;
    tl.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: "power4.out" }, panelStart);

    if (itemEls.length) {
      tl.to(
        itemEls,
        { yPercent: 0, rotate: 0, duration: 0.8, ease: "power4.out", stagger: 0.06 },
        panelStart + 0.1
      );
    }
  }, []);

  const playClose = useCallback(() => {
    const panel = panelRef.current;
    const preContainer = preLayersRef.current;
    if (!panel) return;

    const layers = preContainer
      ? Array.from(preContainer.querySelectorAll<HTMLElement>(".nav-prelayer"))
      : [];

    gsap.to([...layers, panel], {
      xPercent: 100,
      duration: 0.3,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => { busyRef.current = false; },
    });
  }, []);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    if (!icon) return;
    gsap.to(icon, {
      rotate: opening ? 225 : 0,
      duration: opening ? 0.7 : 0.3,
      ease: opening ? "power4.out" : "power3.inOut",
      overwrite: "auto",
    });
  }, []);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;

    const target = opening ? "Close" : "Menu";
    const current = opening ? "Menu" : "Close";
    const seq = [current, target, target];
    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });
    const finalShift = ((seq.length - 1) / seq.length) * 100;
    gsap.to(inner, { yPercent: -finalShift, duration: 0.4, ease: "power4.out" });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) playOpen(); else playClose();
    animateIcon(target);
    animateText(target);
  }, [playOpen, playClose, animateIcon, animateText]);

  const doClose = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      playClose();
      animateIcon(false);
      animateText(false);
    }
  }, [playClose, animateIcon, animateText]);

  // Close on click-away
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        toggleBtnRef.current && !toggleBtnRef.current.contains(e.target as Node)
      ) {
        doClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, doClose]);

  const value: NavMenuContextValue = {
    open,
    toggleMenu,
    closeMenu: doClose,
    iconRef,
    textInnerRef,
    toggleBtnRef,
    textLines,
  };

  return (
    <NavMenuContext.Provider value={value}>
      {children}

      {/* Fixed menu toggle - always on top of everything */}
      <button
        ref={toggleBtnRef}
        className="nav-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={toggleMenu}
        type="button"
      >
        <span className="nav-toggle-text-wrap" aria-hidden="true">
          <span ref={textInnerRef} className="nav-toggle-text-inner">
            {textLines.map((l, i) => (
              <span className="nav-toggle-line" key={i}>{l}</span>
            ))}
          </span>
        </span>
        <span ref={iconRef} className="nav-icon" aria-hidden="true">
          <span className="nav-icon-line" />
          <span className="nav-icon-line nav-icon-line-v" />
        </span>
      </button>

      {/* Panel overlay - only interactive when open */}
      <div
        className="nav-menu-wrapper"
        data-open={open || undefined}
        style={{ pointerEvents: open ? "auto" : "none" }}
      >
        {/* Prelayers */}
        <div ref={preLayersRef} className="nav-prelayers" aria-hidden="true">
          <div className="nav-prelayer" style={{ background: "rgba(40, 20, 80, 0.9)" }} />
          <div className="nav-prelayer" style={{ background: "rgba(20, 15, 35, 0.95)" }} />
        </div>

        {/* Panel */}
        <aside ref={panelRef} className="nav-panel" aria-hidden={!open}>
          <div className="nav-panel-inner">
            <ul className="nav-panel-list" role="list">
              {NAV_ITEMS.map((item) => (
                <li className="nav-panel-item-wrap" key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-panel-item ${pathname.startsWith(item.href) ? "!text-accent" : ""}`}
                    onClick={() => doClose()}
                  >
                    <svg className="nav-panel-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                    <span className="nav-panel-item-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </NavMenuContext.Provider>
  );
}
