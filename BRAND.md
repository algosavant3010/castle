# Castle - Brand Identity & Template

> The brand source of truth for Castle. Colors, type, logo, voice, and usage rules. Castle is a
> **dark-mode-only** product, matching the Monad platform: off-black canvas, off-white text, one
> electric violet accent on every screen. Glassmorphism surfaces with generous radii define the
> visual identity. There is no light theme. This file owns the raw brand values; `DESIGN.md`
> owns the design system and page structures. When values conflict, `BRAND.md` wins on color,
> type, and logo.

---

## 1. Brand Essence

Castle is the trust layer for the agent economy: it lets AI agents transact on-chain at the
speed of Monad while a human owner stays in absolute control. The brand has to carry two
feelings at once.

- **Speed** - lightning, sub-second finality, electric energy. The name Castle means lightning.
- **Safety** - exact, engineered, in control. A security instrument, not a toy.

Personality: knowledgeable, precise, calm under pressure, fast. We show expertise without
showing off. We never look like a generic AI SaaS template.

Three words to design against: **electric, exact, trustworthy.**

---

## 2. Color System (dark only)

Off-black and off-white only, never pure `#000000` or `#FFFFFF`. One accent. Semantic colors
appear only to convey real state, never as decoration.

### 2.1 Core palette

| Token | Name | Hex / Value | Use |
| --- | --- | --- | --- |
| `--bg` | Ink | `#08080A` | Page canvas, the void behind everything |
| `--surface` | Glass | `rgba(255,255,255,0.025)` | Cards, panels (translucent for glassmorphism) |
| `--surface-2` | Glass Deep | `rgba(255,255,255,0.04)` | Nested panels, code blocks, inputs |
| `--border` | Hairline | `rgba(255,255,255,0.06)` | Default 1px separators |
| `--border-strong` | Edge | `rgba(255,255,255,0.12)` | Focus rings, active edges, hover states |
| `--text` | Bone | `#F4F4F5` | Primary text |
| `--text-muted` | Ash | `#8A8A93` | Secondary text, labels |
| `--text-faint` | Smoke | `#6B6B77` | Captions, metadata, disabled |

Body background (applied to `<body>`): `#050505` (slightly darker than `--bg` for the app-bg
layer to have visible grid/glow).

### 2.2 Accent (single, locked)

| Token | Name | Hex | Use |
| --- | --- | --- | --- |
| `--accent` | Castle Violet | `#836EF9` | The one accent: CTAs, links, the bolt, focus |
| `--accent-hover` | Castle Violet Bright | `#9D8BFF` | Hover / focus state |
| `--accent-press` | Castle Violet Deep | `#5B45D6` | Pressed / active |
| `--accent-soft` | Violet Wash | `rgba(131,110,249,0.12)` | Faint fill behind icons, badges, selected rows |

Castle Violet is aligned to Monad Purple so Castle reads as native to the Monad platform. It is a
single flat accent, never a gradient or mesh blob in UI elements (gradients are allowed in
background atmospheric orbs at very low opacity).

### 2.3 Semantic (state only)

| Token | Name | Hex | Use |
| --- | --- | --- | --- |
| `--safe` | Charge | `#34D399` | Funds released, policy valid, healthy, confirmed |
| `--danger` | Surge | `#FB6A6A` | Freeze, abort, blocked drain, expired key, outflow risk |
| `--warning` | Amber | `#F5B544` | Expiring key, near spend cap, needs attention |
| `--info` | (uses `--accent`) | `#836EF9` | Informational highlight |

Semantic colors never decorate. A green border is a promise that something is genuinely safe.

### 2.4 Extended brand palette (illustration and data-viz only)

These echo Monad's wider identity. They are allowed in diagrams, charts, and brand art. They
are **never** used as a UI accent.

| Name | Hex | Use |
| --- | --- | --- |
| Monad Berry | `#A0055D` | Deep brand highlight in illustration / data-viz |
| Monad Indigo | `#200052` | Deep background-tinting in brand art only |
| Off-White | `#FBFAF9` | Monad-aligned light reference for brand art (not app UI) |

### 2.5 Data-visualization scale

Charts use a restrained categorical scale built from the accent and neutrals.

1. `#836EF9` (Castle Violet, primary series)
2. `#9D8BFF` (lighter violet)
3. `#5B45D6` (deep violet)
4. `#38bdf8` (sky blue, tertiary)
5. `#8A8A93` (neutral ash)

Use `--safe` / `--danger` / `--warning` only when the series itself means safe / risk / caution.

### 2.6 Token block (copy-paste)

```css
:root {
  /* surfaces (dark only) */
  --bg: #08080A;
  --surface: rgba(255, 255, 255, 0.025);
  --surface-2: rgba(255, 255, 255, 0.04);
  --border: rgba(255, 255, 255, 0.06);
  --border-strong: rgba(255, 255, 255, 0.12);

  /* text */
  --text: #F4F4F5;
  --text-muted: #8A8A93;
  --text-faint: #6B6B77;

  /* accent (single) */
  --accent: #836EF9;
  --accent-hover: #9D8BFF;
  --accent-press: #5B45D6;
  --accent-soft: rgba(131, 110, 249, 0.12);

  /* semantic */
  --safe: #34D399;
  --danger: #FB6A6A;
  --warning: #F5B544;

  /* radius - smooth rounded */
  --r-sm: 12px;
  --r-md: 16px;
  --r-lg: 20px;
  --r-xl: 24px;
  --r-full: 9999px;

  /* motion - easing (Emil Kowalski curves) */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  /* motion - duration */
  --dur-fast: 150ms;
  --dur-base: 240ms;
  --dur-slow: 520ms;
  --stagger: 50ms;
}
```

### 2.7 Contrast (verified intent)

All pairings must meet WCAG AA. Reference ratios on the dark canvas:
- Bone `#F4F4F5` on Ink `#08080A`: ~18:1 (passes AAA).
- Ash `#8A8A93` on Ink `#08080A`: ~5.6:1 (passes AA for body and large text).
- Castle Violet `#836EF9` on Ink `#08080A`: ~5.2:1 (passes AA for text and UI).
- Accent buttons use dark `--bg` text on Castle Violet fill for AA-safe labels.
- Smoke `#6B6B77` is for non-essential metadata only and is not used for body text.

---

## 3. Typography

Two families. No third. Both are free, modern, and engineered-feeling.

### 3.1 Families
- **Display / UI: Geist** (loaded via `next/font/google`, variable `--font-geist-sans`; fallback:
  Inter, system-ui, sans-serif). Tight, geometric, neutral. Used for everything from headlines
  to labels.
- **Mono: Geist Mono** (variable `--font-geist-mono`; fallback: JetBrains Mono, ui-monospace,
  monospace). Used for addresses, MONAD amounts, function selectors, session-key data, hashes,
  and code. Mono is a brand signal: it marks real on-chain data.

### 3.2 Weights
Display: 400 (body), 500 (labels/medium), 550 (subheads), 600 (headlines/semibold). Avoid 700+;
the brand reads sharp, not heavy. Mono: 400 to 500.

### 3.3 Type scale (desktop, fluid down on mobile)

| Role | Font | Size / line-height | Weight | Tracking |
| --- | --- | --- | --- | --- |
| Display (hero) | Geist | clamp(3rem, 5vw, 5rem) / 1.05 | 700 (bold) | -0.03em |
| H1 | Geist | 48 / 1.08 | 600 | -0.025em |
| H2 | Geist | clamp(2rem, 4vw, 3rem) / 1.1 | 600 | -0.025em |
| H3 | Geist | 24 / 1.25 | 600 | -0.01em |
| Body L | Geist | 18 / 1.6 | 400 | 0 |
| Body | Geist | 16 / 1.6 | 400 | 0 |
| Small | Geist | 14 / 1.5 | 400 | 0 |
| Label / eyebrow | Geist | 12-13 / 1.2 | 500-600 | 0.04-0.08em, uppercase |
| Mono data | Geist Mono | 14 / 1.5 | 450 | 0 |
| Mono small | Geist Mono | 11-12 / 1.5 | 450 | 0 |

Base font-size: 14px mobile, 16px desktop (set on `<html>`).

### 3.4 Rules
- Eyebrows name the topic in plain language (`Pre-sign simulation`), never section numbers.
- Numbers, balances, and addresses are always mono and tabular-aligned.
- Headlines often use gradient text (`bg-gradient-to-b from-text to-muted/80 bg-clip-text`).
- No em-dashes or en-dashes in any brand copy. Use a hyphen or restructure the sentence.

---

## 4. Logo & Marks

Castle uses multiple mark variants for different contexts.

### 4.1 The bolt (icon mark)

A single geometric bolt with a slight forward lean (left to right, like a transaction settling).

```svg
<svg width="32" height="32" viewBox="0 0 32 32" fill="none"
     xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Castle">
  <path d="M18.6 3 L8 17.6 H14.3 L13 29 L24 13.4 H17.5 L18.6 3 Z"
        fill="#836EF9"/>
</svg>
```

Single-stroke variant (for the signing animation and small favicons):

```svg
<svg width="32" height="32" viewBox="0 0 32 32" fill="none"
     xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Castle">
  <path d="M18.6 3 L8 17.6 H14.3 L13 29 L24 13.4 H17.5 L18.6 3 Z"
        fill="none" stroke="#836EF9" stroke-width="2"
        stroke-linejoin="round" stroke-linecap="round"/>
</svg>
```

### 4.2 MetallicLogo (primary app mark)

The primary brand mark in the app uses a WebGL liquid-metal shader effect (`MetallicPaint`
from ReactBits). It is the default loading indicator (`CastleLoader`) and appears in the
marketing navbar. Rendered via `components/ui/metallic-logo.tsx`.

### 4.3 CastleIcon (app topbar)

A simplified castle/shield SVG mark used in the app topbar for quick recognition at small sizes.
Rendered via `components/ui/castle-logo.tsx`. The favicon is `castle.svg`.

### 4.4 CastleIcon (bolt component)

A React component (`components/ui/castle-logo.tsx`) rendering the castle mark as inline SVG.
Accepts `size` and `color` props. Used on the connect page and footer.

### 4.5 Wordmark lockup

Mark sits left of the wordmark in both the marketing navbar and app topbar:
- Marketing: MetallicLogo + "Castle" text (Geist, 600, -0.03em tracking)
- App: CastleIcon + "Castle" text (13-14px, semibold)

### 4.6 Color variants (dark only)
- **Primary**: Castle Violet bolt + Bone wordmark on Ink. The default everywhere.
- **Mono light**: full Bone (`#F4F4F5`) bolt + wordmark, for busy backgrounds.
- **Accent fill**: used in `CastleIcon` component with `color="var(--accent)"`.
There is no dark-on-light variant because Castle has no light surfaces.

### 4.7 Clear space and sizing
- Clear space on all sides equals the bolt height.
- Minimum size: 20px bolt height (icon), 96px width (lockup).

### 4.8 Misuse (do not)
- Do not add a gradient, glow, or outer badge to the bolt SVG mark.
- Do not recolor the bolt to any non-brand hue.
- Do not rotate, skew, stretch, or re-space the wordmark.
- Do not reconstruct the bolt with different geometry. Use the path above.

---

## 5. Iconography

- Line icons, 1.5px to 2px stroke, rounded joins/caps, on a 24px grid (reduced to 16-18px in
  compact contexts). Match the wordmark weight.
- Monochrome by default (`currentColor` inheriting `--text` or `--text-muted`); accent color
  only for the active or primary icon in a group.
- SVG icons are inlined directly in components (no icon library dependency).
- The bolt is the only filled brand glyph. Do not invent additional filled mascots.

---

## 6. Surfaces, Depth, Shape

- **Shape**: smooth rounded. Interactive elements and cards use generous radii (12-24px).
  Full-round (`9999px`) is used for pills, chips, navbar capsule, and avatars.
- **Glassmorphism** is the dominant surface treatment: translucent backgrounds
  (`rgba(255,255,255,0.025)`), `backdrop-filter: blur(12px)`, hairline borders. Cards lift
  subtly on hover (translateY -1px) and gain stronger border color.
- **Depth**: comes from translucency layers, backdrop blur, and subtle box-shadows.
  `glass-card` (standard surfaces) and `glass-strong` (modals, popovers with heavier blur
  and higher opacity background).
- **BorderGlow**: The primary card treatment in the app uses the ReactBits `BorderGlow`
  component with standardized props from `lib/ui.ts` (`GLOW_PROPS`). This provides a
  mouse-tracking glow border effect.
- **Shadows**: near-invisible on standard cards. Prominent on floating elements like the navbar
  capsule (`box-shadow: 0 16px 40px -12px rgba(0,0,0,0.8)`) and modals.

---

## 7. Motion (brand-level)

Motion is communication, never decoration (full vocabulary in `DESIGN.md` Section 6).
- Natural easing, never linear. Short, confident durations. One pass, then quiet.
- The signature beat: the bolt draws on (stroke-dashoffset) at the signing moment, then a single
  accent flash. This is the brand's recognizable motion.
- Page transitions use the React ViewTransition API with directional slides and scale/fade.
- Always interruptible and `prefers-reduced-motion` aware.
- GSAP for scroll-driven animations (ScrollTrigger). Motion (Framer Motion) for component
  spring animations.

---

## 8. Voice & Tone

We sound like an expert peer, not a vendor and not a hype machine.

- **Knowledgeable, not instructive.** Speak the user's language; do not condescend.
- **Calm and exact.** Short sentences. Concrete claims. No superlatives like "unbelievable" or
  "best-ever". Show, do not tell.
- **Honest about risk.** Security copy states consequences plainly, especially for
  irreversible actions (freeze, emergency withdraw).
- **No filler, no hype gradients in words.** Avoid exclamation points and breathless tone.

Copy mechanics:
- No em-dashes or en-dashes. Use hyphens or restructure.
- Numbers, addresses, and amounts in mono.
- Plain-language labels over jargon where possible (`Accept task` next to the selector hash).

Voice examples:
- Hero: "Let agents transact. Keep your funds untouchable."
- Subtext: "Time-boxed session keys, on-chain spend limits, and pre-sign simulation. The
  blockchain enforces the rules your agent cannot break."
- Emergency confirm: "Freezing revokes every active session key for this agent. The agent
  starts receiving Unauthorized within a block. This is reversible."

---

## 9. Brand Quick Template

A one-glance reference for a new screen, doc, or asset.

```
THEME      Dark only. Ink #08080A canvas, Bone #F4F4F5 text. No light mode.
ACCENT     Castle Violet #836EF9 (Monad-aligned). One accent. No gradients on UI elements.
TYPE       Geist (UI) + Geist Mono (data/amounts/addresses). Headlines 600, max 2 lines.
SHAPE      Smooth rounded. 12-24px radius on cards/interactive. Full-round = pills/chips/nav.
SURFACE    Glassmorphism: translucent bg + backdrop-blur + hairline border. BorderGlow cards.
LOGO       MetallicLogo (app), bolt mark (brand), CastleIcon (topbar). Violet on dark.
DEPTH      Translucency + backdrop blur + subtle shadows. No heavy drop shadows.
MOTION     Purposeful, eased, short. Bolt draw-on = the signature beat. View Transitions.
SEMANTIC   Charge #34D399 safe, Surge #FB6A6A danger, Amber #F5B544 warning. State only.
VOICE      Expert peer. Exact, calm, honest about risk. No em-dashes, no hype.
NEVER      Light mode, purple mesh blobs, second accent, em-dashes, heavy shadows.
```

---

## 10. Brand Pre-Flight

- [ ] Dark only. No light surface anywhere.
- [ ] One accent (Castle Violet `#836EF9`). No second UI accent.
- [ ] Geist + Geist Mono only. Amounts and addresses in mono.
- [ ] Smooth rounded shape: 12-24px card radius, full-round for pills/chips.
- [ ] Glassmorphism surfaces with backdrop-blur and hairline borders.
- [ ] Logo uses correct variant for context (MetallicLogo, CastleIcon, CastleIcon, or bolt SVG).
- [ ] Semantic colors used only for real state, never decoration.
- [ ] WCAG AA contrast on dark surfaces holds for all text.
- [ ] Copy has no em-dashes or en-dashes; tone is exact and calm.
