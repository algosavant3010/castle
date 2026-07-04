# Castle - Design System & UI/UX Spec

> The taste layer for Castle. This file is the dominant source of truth for any agent or
> engineer building Castle UI. It documents the actual design system as implemented: the color
> tokens, glassmorphism surface model, smooth rounded shapes, motion vocabulary, component
> patterns, and page structures. Inspired by Emil Kowalski's motion craft and the
> taste-skill/impeccable approach to premium dark interfaces.

---

## 0. Design Read (brief inference)

One-line read before any code:

**Castle is secure-autonomy infrastructure for the agent economy. The interface should feel
like a high-precision security terminal with glassmorphic depth, one electric accent, and
motion that snaps and settles like a real instrument - polished, not clinical.**

- Page kind: developer/infrastructure product (marketing + full app).
- Audience: protocol engineers, agent builders, security-minded founders.
- Vibe words: electric, exact, trustworthy, polished, atmospheric.
- What to avoid: generic SaaS templates, heavy shadows, multiple accent colors, light mode.

---

## 1. Product Context

Castle lets AI agents negotiate, work, and pay each other on-chain without ever exposing a
human owner's funds to catastrophic risk. Three primitives carry the story:

1. Account abstraction (owner / signer separation)
2. Time-boxed, rule-bound session keys
3. Pre-sign simulation (look before you leap)

The design must make two feelings land instantly: **speed** (sub-second finality on Monad)
and **safety** (the human can freeze and sweep at any time). Every visual and motion choice
should serve one of those two ideas.

---

## 2. The Locks

Three rules the build never relaxes.

### 2.1 Color Consistency Lock
One accent across the entire app: **Castle Violet** (`#836EF9`, aligned to Monad Purple). No
second accent color. Semantic colors (safe-green, danger-red, warning-amber) appear only to
convey real state, never as decoration.

### 2.2 Shape Consistency Lock
Smooth rounded system. Cards and interactive surfaces use generous radii (12-24px).
Full-round (`9999px`) is reserved for pills, chips, the navbar capsule, and avatar shapes.
No sharp/square-cornered cards.

### 2.3 Page Theme Lock
**Dark only.** Castle is a dark-mode product, like the Monad platform. Off-black canvas,
off-white text, everywhere, every screen. There is no light theme. Glassmorphism surfaces
provide depth through translucency, not brightness.

---

## 3. Color System

Off-black canvas with translucent surfaces. Never pure `#000` or `#FFF`.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#08080A` | Page canvas |
| `--surface` | `rgba(255,255,255,0.025)` | Cards, raised panels (translucent glass) |
| `--surface-2` | `rgba(255,255,255,0.04)` | Nested panels, code blocks, inputs |
| `--border` | `rgba(255,255,255,0.06)` | Hairline 1px borders |
| `--border-strong` | `rgba(255,255,255,0.12)` | Focus / active / hover edges |
| `--text` | `#F4F4F5` | Primary text |
| `--text-muted` | `#8A8A93` | Secondary text, labels |
| `--text-faint` | `#6B6B77` | Captions, metadata |
| `--accent` | `#836EF9` | Single accent: CTAs, links, the bolt |
| `--accent-hover` | `#9D8BFF` | Hover / focus state of accent |
| `--accent-press` | `#5B45D6` | Pressed / active state |
| `--accent-soft` | `rgba(131,110,249,0.12)` | Accent wash behind icons, badges |
| `--safe` | `#34D399` | Semantic only: funds released, policy valid |
| `--danger` | `#FB6A6A` | Semantic only: freeze, abort, expired key |
| `--warning` | `#F5B544` | Semantic only: expiring key, near cap |

Body background: `#050505` (slightly below `--bg` for the app-bg grid layer to be visible).

Accent discipline: violet is justified here (Monad's identity is purple and Castle means
lightning), but it stays a single accent on neutral glass surfaces.

Contrast: every text-on-surface pair must meet WCAG AA. `--text-muted` on `--bg` clears 4.5:1.

---

## 4. Typography

Two families. No third.

- **Display / UI: Geist** (loaded via `next/font/google`; fallback: Inter, system-ui).
- **Mono: Geist Mono** (fallback: JetBrains Mono, ui-monospace). Used for addresses, amounts,
  function selectors, session-key data, code.

Base font-size: 14px on mobile, 16px on desktop (responsive via media query on `<html>`).

Scale:

| Role | Size / line-height | Weight | Tracking |
| --- | --- | --- | --- |
| Display (hero) | clamp(3rem, 5vw, 5rem) / 1.05 | 700 | -0.03em |
| H2 | clamp(2rem, 4vw, 3rem) / 1.1 | 600 | -0.025em |
| H3 | 24 / 1.25 | 600 | -0.01em |
| Body L | 18 / 1.6 | 400 | 0 |
| Body | 16 / 1.6 | 400 | 0 |
| Small | 14 / 1.5 | 400 | 0 |
| Label / eyebrow | 12-13 / 1.2 | 500-600 | 0.04-0.08em, uppercase |
| Mono data | 14 / 1.5 | 450 | 0 |
| Mono small | 11-12 / 1.5 | 450 | 0 |

Headlines frequently use gradient text: `bg-gradient-to-b from-text to-muted/80 bg-clip-text
text-transparent` for visual depth.

---

## 5. Spacing, Grid, Radius

- Spacing: Tailwind defaults. Common gaps: 2, 3, 4, 5, 6, 8, 12, 16 (in Tailwind units).
- Grid: responsive columns (1 mobile, 2 tablet, 3-4 desktop). Max content width 1200px,
  page padding 24px (mobile) / 48px (desktop).
- Radius tokens:
  - `--r-sm: 12px` - buttons, inputs, small interactive elements
  - `--r-md: 16px` - medium cards, panels
  - `--r-lg: 20px` - standard cards (matches BorderGlow `borderRadius: 20`)
  - `--r-xl: 24px` - large modals, popovers, glass-strong surfaces
  - `--r-full: 9999px` - pills, chips, navbar capsule, status dots
- Borders: 1px hairline using `--border`. Hover/focus state bumps to `--border-strong`.
- Elevation: glassmorphism (backdrop-blur) provides perceived depth. Shadows are subtle
  except on floating nav (`0 16px 40px -12px rgba(0,0,0,0.8)`) and modals.

---

## 6. Motion Vocabulary

Motion is communication. Every animation has a reason, natural easing, and confident duration.

### 6.1 Principles

**Two layers of motion:**

- **Interface Layer** (buttons, cards, data, state transitions): purposeful only. Every
  animation shows state change, reveals hierarchy, or guides attention.
- **Environment Layer** (backgrounds behind the interface): bounded ambient motion is
  permitted on specific surfaces (connect page, signing-flow, interstitials). Must yield GPU
  when scrolled past, degrade under `prefers-reduced-motion`.

Core principles:
- **Purpose over decoration.** Animate to show state change, reveal hierarchy, or guide
  attention. Never animate to look busy.
- **Natural easing, never linear.** Linear motion reads mechanical and cheap.
- **Short and settled.** UI feedback is fast; reveals settle quickly and stop.
- **Orchestration.** Compose entrances with stagger so the eye reads order, not chaos.
- **Interruptible.** Spring and transform-based motion should survive rapid interaction.
- **Respect `prefers-reduced-motion`.** Drop transforms and background animation, keep opacity
  fades only.

### 6.2 Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | General smooth-out motion |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances, reveals (fast in, soft settle) |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | General UI transitions |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Symmetric transitions (exit/enter) |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Drawer/panel slide-in |
| `--dur-fast` | 150ms | Hover, press, focus feedback |
| `--dur-base` | 240ms | Standard transitions |
| `--dur-slow` | 520ms | Hero reveal, large layout shifts |
| `--stagger` | 50ms | List / grid item entrance offset |

### 6.3 Patterns
- **Page transitions:** React ViewTransition API with directional classes (`nav-forward`,
  `nav-back`) for slide animations and default `page-enter`/`page-exit` for scale+fade+blur.
- **Scroll reveal:** Sections use GSAP `ScrollTrigger` or `AnimatedContent` (ReactBits) for
  fade-rise on enter. Trigger once, no re-trigger.
- **Horizontal scroll-pin:** How it Works section uses GSAP pinning with scrub for horizontal
  card traversal on desktop.
- **The "sign" beat:** Bolt SVG draw-on (stroke-dashoffset from full to 0) over scroll/time
  with `expo.out` easing. The brand's signature micro-moment.
- **Card hover:** translateY(-1px), border-color brightens, subtle box-shadow increase.
  Duration: 200ms with `--ease-out`.
- **Button press:** scale(0.97) on active, spring-back on release.
- **Nav menu:** Full-screen GSAP slide-in with colored prelayer slabs (staggered) and
  `power4.out` easing. Items stagger-reveal with yPercent + rotate.
- **Loading state:** MetallicLogo (liquid metal shader) centered. No skeleton screens.

### 6.4 Implementation
- Component animation: **Motion** (Framer Motion) for React spring animations.
- Scroll animation: **GSAP ScrollTrigger** with `useGSAP` hook.
- Page transitions: **React ViewTransition API** (Next.js 16+ native support).
- ReactBits components: AnimatedContent, FadeContent, BlurText, RotatingText, CountUp,
  ScrambledText, DecryptedText, ShinyText, ClickSpark, StarBorder.

---

## 7. Background Treatment

### 7.1 App Background (default)
The app uses a fixed background layer (`.app-bg`) behind all content:
- Base: `#050505` with a subtle dot-mesh pattern (`radial-gradient` 24px grid, very faint)
- Grid overlay: accent-colored grid lines (64px spacing) with a radial mask that fades edges,
  animated with a slow opacity pulse (12s cycle)
- Accent glow: two large radial gradients (violet) that drift slowly (25s cycle)
- All background animation respects `prefers-reduced-motion`

### 7.2 Environment Layer (opt-in surfaces)
ReactBits background components are allowed on non-competing surfaces:
- **Connect page**: LiquidEther (WebGL, violet hue, 25% opacity)
- **Signing Flow section**: Lightning (WebGL, hue 270, 30% opacity)
- **Hero section**: LaserFlow (CSS-based, violet accent)

Available backgrounds (preview at /settings/backgrounds):
Aurora, Beams, DarkVeil, FaultyTerminal, LetterGlitch, Lightning, LiquidEther, LaserFlow,
SideRays.

Rules for Environment Layer:
- Tune to violet hue only, opacity capped at ~0.25-0.35
- Must yield GPU resources when scrolled past or tab hidden
- Must degrade to static frame under `prefers-reduced-motion`
- Never behind data-dense app screens (dashboard, wallets, marketplace)
- `pointer-events: none` always

### 7.3 Accessibility
- Under `prefers-reduced-motion: reduce`, all animations (background and interface) are
  killed via `!important` duration overrides.
- Dark surfaces maintain WCAG AA contrast for all text.

---

## 8. Theme: Dark Only

Castle is dark-mode only, matching the Monad platform. There is no light theme.
- Single canvas: off-black `--bg` with translucent glass surfaces on every screen.
- Do not build a light variant, a theme toggle, or a one-off light section.
- All contrast targets (WCAG AA) are met against the dark surfaces in Section 3.

---

## 9. Logo & Marks

Multiple mark variants (see BRAND.md Section 4 for full details):
- **MetallicLogo**: WebGL liquid-metal shader mark. Primary loading state and marketing navbar.
- **CastleIcon**: Simplified castle SVG. App topbar (20px) and favicon.
- **CastleIcon**: Bolt SVG component. Connect page, footer, and brand contexts.
- **Bolt mark**: The geometric bolt path (Section 9 of BRAND.md). Used in signing animation
  draw-on and as the conceptual brand symbol.

---

## 10. App Shell

### 10.1 Layout Structure
```
RootLayout (Geist fonts, bg-bg text-text)
  ├── (marketing)/ - Navbar + Footer shell, no auth required
  └── (app)/ - Providers (wagmi, TanStack Query, RainbowKit) + AuthGuard
               └── Topbar + PageTransition + content
```

### 10.2 Topbar (app)
- Sticky, `z-50`, height 48px (mobile) / 56px (desktop).
- Left: CastleIcon + "Castle" wordmark (link to /dashboard).
- Right (desktop): GooeyNav particle-based navigation with pathname sync.
- Mobile: fixed bottom bar with 5 icon links (Dashboard, Wallets, Market, Activity, Settings).
- Background: transparent (glass effect inherited from page).

### 10.3 GooeyNav (desktop navigation)
A particle-explosion navigation component from ReactBits. On click, particles burst from the
active item using a CSS gooey filter. Colors cycle through accent variants. Active item
determined by pathname matching.

### 10.4 Nav Menu (full-screen overlay)
A GSAP-animated full-screen navigation panel triggered by a fixed toggle button (z-950):
- Two colored prelayer slabs slide in with stagger (purple/deep purple, `power4.out`)
- Panel slides in from right with route links
- Items reveal with yPercent(120) + rotate(6deg) stagger animation
- Closes on: click-away, Escape key, route change
- Toggle button rotates 225deg between + and x states

### 10.5 PageTransition
Wraps all app page content with React `<ViewTransition>`. Provides:
- `nav-forward`: slide-left-out (old) + slide-right-in (new)
- `nav-back`: slide-right-out (old) + slide-left-in (new)
- `page-enter`/`page-exit`: scale + fade + blur crossfade (default)
- Topbar is anchored (no animation during transitions)

### 10.6 AuthGuard
Gates app access behind wallet connection. If not connected, redirects to `/connect` (the
onboarding page with stepper and T&C flow).

### 10.7 TransactionOverlay
Global overlay triggered by custom events (`castle:tx-pending`). Blurs the app with a
half-screen prompt directing the user to confirm in MetaMask.

### 10.8 CastleLoader
Loading state: MetallicLogo centered on screen. Two variants:
- `fullscreen`: min-height 60vh, size 96px
- `inline`: py-6, size 48px

---

## 11. Landing Page Layout

A vertical scroll narrative. Sections: Hero > Partners > How it Works > Safety > Why Monad.

### 11.1 Navigation (marketing)
- Floating pill navbar that shrinks into a centered blurred capsule on scroll.
- At rest: full-width, transparent, no border.
- Scrolled: max-w-5xl, rounded-full, backdrop-blur-2xl, hairline border, deep shadow.
- Left: MetallicLogo + "Castle" wordmark. Center: nav links (absolutely positioned for true
  centering). Right: "Get started" accent pill button.
- Mobile: hamburger that opens a rounded dropdown with backdrop-blur.

### 11.2 Hero (above the fold)
The hero showcases a live Shield Visualization demonstrating Castle catching threats in real-time:
- **Background**: LaserFlow (violet accent, CSS-based) + atmospheric gradient orbs
- **Left column**: Large headline with BlurText entrance, gradient text, RotatingText for
  cycling keywords, ClickSpark interaction
- **Right column**: ShieldVisualization component - animated circular shield with orbiting
  agent dots, ripple effects on blocked threats, and a live threat feed showing real-time
  scanning/blocking of agent transactions with status indicators
- **Stats bar**: real-time counters (scanned, blocked, saved USD) with ShinyText
- **CTA**: Single accent button ("Launch app") + secondary text link
- **Eyebrow**: Small pill badge with animated dot + uppercase label

### 11.3 Partners (logo marquee)
Scrolling logo marquee of partner/integration logos with dual-direction animation and hover
pause. Faded edges via gradient masks.

### 11.4 How it Works (horizontal scroll-pinned)
The most complex animation section:
- On desktop: GSAP ScrollTrigger pins the section, then scrubs a horizontal timeline through
  three primitive cards (Account Abstraction, Session Keys, Pre-Sign Simulation).
- Each card has: eyebrow, title, description, animated stat (CountUp), and floating icon.
- SVG connecting line draws on during scroll (gradient stroke, glow filter).
- Progress bar fills as user scrolls.
- Below the cards: a details strip with three summary points.
- Mobile: falls back to a standard vertical card stack.

### 11.5 Signing Flow
- RotatingText headline cycling through transaction lifecycle steps.
- Three-column layout: step list (FadeContent stagger) | bolt SVG (draw-on) | description panel.
- Lightning WebGL background (30% opacity, violet hue).
- StarBorder CTA link at bottom.
- Steps: Intent > Draft > Simulate > State diff > Sign > Broadcast.

### 11.6 Safety / Human Override
- Two glass cards in a 2-column grid: `freezeAgent()` (danger accent) and
  `emergencyWithdraw()` (warning accent).
- Hover glow borders that tint to the semantic color.
- ScrambledText component for code-like text reveals.
- Background: faint radial glows (danger-tinted and warning-tinted).

### 11.7 Why Monad
- 4-column responsive grid of stat cards.
- Each card: icon, CountUp number with prefix/suffix, label, description.
- Hover glow effect (accent gradient from top).
- Background: atmospheric violet orbs with drift animation.
- Stats: <1s finality, 10,000+ TPS, ~$0.001 gas, 100% EVM compatible.

### 11.8 Footer
- Multi-column layout (5+7 grid): brand column (CastleIcon, DecryptedText "Castle", description,
  ShinyText tagline) + three link columns (Product, Resources, Community).
- TargetCursor effect on hover (crosshair follows mouse, locks to links).
- Accent glow line at top border.
- Bottom bar: copyright + Privacy/Terms links.
- AnimatedContent scroll entrance.

---

## 12. App Pages

### 12.1 Dashboard
- Empty state: centered BorderGlow card with bolt icon, welcome message, deploy CTA.
- Data state: metrics grid (2-col mobile, 3-col desktop) with BorderGlow cards showing
  Total Balance, AI Wallets count, Open Tasks. Quick action cards (New AI Wallet, Marketplace).
  Recent activity list with StatusIcon live indicator.

### 12.2 Wallets
- Grid of WalletCard components (sm:grid-cols-2), each wrapped in BorderGlow.
- Card shows: wallet icon, name (from Supabase), balance, active session count, status
  (active/idle/frozen). Links to detail page.
- Actions: freeze, withdraw, delete (with confirmation dialogs).

### 12.3 Wallet Detail (/wallets/[address])
- Full wallet management: balance display, session list, create new session (3-step flow with
  preset selection: Marketplace Worker, Payment Agent, Custom).
- Session configuration: daily cap, expiry, target whitelist, function selectors.
- Danger zone: freeze all, emergency withdraw.

### 12.4 Create Wallet
- Single BorderGlow card, max-w-xl centered.
- Required wallet name input (saved to Supabase `vaults.agent_name`).
- "What you get" info box. Deploy button with MetaMask confirmation.
- Three-step flow: configure > deploying > success.

### 12.5 Marketplace
- Tab-based filtering (pill tabs in rounded container): Open, Accepted, Submitted, Released,
  Disputed.
- Task cards with status chips, spec URI, buyer/worker addresses, reward amount.
- Create Task modal (glass-strong backdrop): textarea, reward input, deadline input.

### 12.6 Activity
- Two tabs: Live events (on-chain) and Sessions (local activity log).
- Event rows with colored status icons and timestamps.
- Real-time subscription to blockchain events.

### 12.7 Settings
- Three-tab interface: Account, Alerts, Danger zone.
- Account: connected wallet info, AI wallet balances.
- Alerts: Telegram integration with OTP verification flow.
- Danger zone: batch freeze all sessions, batch sweep all wallets.

### 12.8 Connect (onboarding)
- Split layout: left = big CastleIcon + branding (desktop only), right = stepper card.
- LiquidEther WebGL background (25% opacity).
- Three-step Stepper: How it works > Safety > Terms acceptance (checkbox gate).
- After completion: RainbowKit connect modal.
- Auto-redirects to /dashboard on connection.

### 12.9 Backgrounds (settings sub-page)
- Preview gallery of all ReactBits background components.
- Selector buttons + live preview area (400px height).
- Usage rules documentation.

---

## 13. Components

### 13.1 Surfaces
- **BorderGlow card**: The primary card wrapper. Mouse-tracking glow border from ReactBits.
  Standard props in `lib/ui.ts` (borderRadius 20, backgroundColor #0c0c12, accent colors,
  glowRadius 30, coneSpread 25).
- **glass-card**: CSS class for standard glassmorphism surfaces (backdrop-blur-12, translucent
  bg, hairline border, hover lift).
- **glass-strong**: CSS class for modals/popovers (blur-32, higher-opacity bg, heavier shadow,
  inset highlight).

### 13.2 Buttons
- **btn btn-primary**: Accent fill, dark text, 12px radius, glow shadow. Hover: brighter +
  stronger shadow. Press: scale(0.97).
- **btn btn-ghost**: Transparent, hairline border. Hover: border brightens, faint bg fill.
- **btn btn-danger**: Danger-tinted transparent fill + border. Hover: stronger tint.
- **action-btn**: Extended button with shine-sweep on hover (gradient translateX animation)
  and glow pulse on press. Variants: `--accent`, `--danger`, `--default`.

### 13.3 Inputs
- Rounded-xl (via inline class), hairline border, translucent bg (`bg-white/[0.03]`),
  backdrop-blur. Focus: border transitions to accent. Placeholder: `text-faint`.

### 13.4 Chips / Status badges
- `.chip` class: full-round, small padding, 11px font, 500 weight.
- Color variants by status: `bg-accent/15 text-accent` (Open), `bg-safe/10 text-safe`
  (Released), `bg-danger/10 text-danger` (Disputed), `bg-white/[0.06] text-muted` (default).

### 13.5 StatusIcon
A reusable dot/icon component with semantic variants (live, active, idle, open, etc.) and
optional pulse animation.

### 13.6 Scrollbar
Custom thin scrollbar: 6px width, accent-colored thumb (20% opacity), transparent track.
Hover: thumb brightens to 40%.

---

## 14. Anti-Slop Guidelines

These are the guardrails that keep the UI premium:

- No em-dashes or en-dashes anywhere in copy.
- No section-numbering eyebrows (`00 / INDEX`). Name the topic plainly.
- No hero version labels (`V0.6`, `BETA`) unless this is a launch page.
- No decorative status dots. Semantic state only.
- No three-equal-card feature rows on marketing. Use scroll-pin, asymmetric grids, or
  stagger-reveal layouts.
- No AI-purple mesh blob gradients. Atmospheric orbs are allowed but must be very low opacity
  and radially masked.
- No hand-rolled decorative SVG illustrations beyond the geometric bolt mark.
- No skeleton loading screens. Use MetallicLogo (CastleLoader).
- No second accent color. Everything is Castle Violet or neutral.
- No heavy drop shadows. Depth comes from glassmorphism (translucency + blur + border).
- No light mode or light sections.
- No inline styles for colors or durations. Consume CSS tokens.

---

## 15. Implementation Notes

- Stack: React 19 / Next.js 16 + TypeScript + Tailwind CSS 4.
- Animation: Motion (Framer Motion) for springs, GSAP + ScrollTrigger for scroll sequences,
  React ViewTransition API for page changes.
- ReactBits library: backgrounds, text effects, interactions (AnimatedContent, BorderGlow,
  StarBorder, ClickSpark, Stepper, etc.).
- All tokens in Section 3 are CSS custom properties mapped to Tailwind via `@theme inline`.
- The bolt is shipped as multiple components (CastleIcon, MetallicLogo, CastleIcon) for
  different contexts.
- Supabase for data persistence (wallet names, agents, transactions, policies).
- Wagmi + RainbowKit for wallet connection. Viem for on-chain reads/writes.
- TanStack Query for async state management.

---

## 16. Pre-Flight Check

Every box must honestly pass before shipping a screen.

- [ ] One accent only across the page (Castle Violet).
- [ ] Smooth rounded shape system (12-24px, full-round for pills).
- [ ] Dark only, glassmorphism surfaces, no light sections.
- [ ] All motion uses easing tokens, never linear, and respects reduced-motion.
- [ ] Page transitions use ViewTransition API with proper enter/exit classes.
- [ ] Cards use BorderGlow with standard GLOW_PROPS or glass-card class.
- [ ] Loading states use CastleLoader (MetallicLogo), not spinners or skeletons.
- [ ] No item from the Section 14 guidelines appears anywhere.
- [ ] WCAG AA contrast holds for all text on dark surfaces.
- [ ] Environment Layer backgrounds (WebGL) only on non-competing surfaces, capped opacity,
      reduced-motion fallback.
- [ ] Mobile responsive: bottom nav bar, fluid type, single-column fallbacks.
