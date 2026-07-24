# BuildSchoolOS — Showcase Website

An award-tier marketing site for **BuildSchoolOS**, positioned like a billion-dollar SaaS
company (Apple / Stripe / Linear / Vercel) rather than a traditional school ERP. Built to
convert principals and institutions into booked demos.

> This is a standalone site, independent of the main `frontend/` (Next.js) and `backend/` apps.
> It has its own `package.json` and dev server.

## Stack

- **React 19** + **TypeScript** on **Vite**
- **Tailwind CSS v4** (CSS-first `@theme` config, no `tailwind.config.js`)
- **Framer Motion** — reveals, layout animations, magnetic/3D interactions
- **GSAP + ScrollTrigger** + **Lenis** — smooth scroll driven by the GSAP ticker
- **Embla Carousel** — testimonials
- **Lucide** icons

Everything visual is hand-built — no image mockups. The dashboard, phone and tablet previews
are live DOM rendered through `ScaledPreview` so they stay crisp and theme-aware at any size.

## Getting started

```bash
cd showcase-website
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Structure

```
src/
├─ components/
│  ├─ effects/     Aurora, particles, cursor, mouse glow, scroll progress, noise
│  ├─ layout/      Navbar (mega-menu), Footer, DemoModal
│  ├─ product/     DashboardUI, device frames, charts, ScaledPreview
│  ├─ sections/    Hero, Trust, ProductShowcase, WhySchoolOS, Modules, AISection,
│  │               WorkflowBuilder, Features, Pricing, Testimonials, FAQ, FinalCTA
│  └─ ui/          MagneticButton, GlassCard, Reveal, Counter, Primitives, SocialIcons
├─ data/site.ts    All copy: 100+ modules, AI agents, pricing, FAQ, nav, testimonials
├─ hooks/          useLenis, useMouse, useTheme
├─ lib/            utils, motion presets
└─ index.css       Design system: tokens, light/dark themes, animations, utilities
```

## Design system

- **Palette** — Brand `#6D28D9`, Azure `#2563EB`, Aqua `#06B6D4`; ink neutrals for
  light/dark surfaces. Tokens live in `src/index.css` under `@theme` and `@layer base`.
- **Type** — Inter (body), Plus Jakarta Sans (display), Space Grotesk (mono).
- **Theme** — light + dark via a `.dark` class on `<html>`, persisted to `localStorage`,
  toggled in the navbar. Respects `prefers-color-scheme` on first visit.
- **Motion** — cinematic rise + de-blur reveals (never a plain fade). All motion is gated
  behind `prefers-reduced-motion`.

## Notes

- No fabricated third-party logos or fake customer names — launch-partner placeholders and
  founding-cohort framing are used instead.
- Below-the-fold sections are code-split (`React.lazy`) so the hero paints fast.
- The demo form is front-end only; wire `DemoModal`'s submit handler to your CRM/endpoint.
