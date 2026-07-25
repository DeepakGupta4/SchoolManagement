import { lazy, Suspense, useCallback, useState } from 'react'
import { useLenis } from '@/hooks/useLenis'
import { ThemeProvider } from '@/hooks/useTheme'

import { Navbar } from '@/components/layout/Navbar'
import { DemoModal } from '@/components/layout/DemoModal'
import { AnimatedCursor, MouseGlow, ScrollProgress } from '@/components/effects/Cursor'
import { NoiseOverlay } from '@/components/effects/Backdrop'

import { Hero } from '@/components/sections/Hero'
import { Trust } from '@/components/sections/Trust'

/* Everything below the fold is code-split so the hero paints fast. */
const ProductShowcase = lazy(() =>
  import('@/components/sections/ProductShowcase').then((m) => ({ default: m.ProductShowcase })),
)
const WhySchoolDeck = lazy(() =>
  import('@/components/sections/WhySchoolDeck').then((m) => ({ default: m.WhySchoolDeck })),
)
const Modules = lazy(() =>
  import('@/components/sections/Modules').then((m) => ({ default: m.Modules })),
)
const AISection = lazy(() =>
  import('@/components/sections/AISection').then((m) => ({ default: m.AISection })),
)
const WorkflowBuilder = lazy(() =>
  import('@/components/sections/WorkflowBuilder').then((m) => ({ default: m.WorkflowBuilder })),
)
const Features = lazy(() =>
  import('@/components/sections/Features').then((m) => ({ default: m.Features })),
)
const Pricing = lazy(() =>
  import('@/components/sections/Pricing').then((m) => ({ default: m.Pricing })),
)
const Testimonials = lazy(() =>
  import('@/components/sections/Testimonials').then((m) => ({ default: m.Testimonials })),
)
const FAQ = lazy(() => import('@/components/sections/FAQ').then((m) => ({ default: m.FAQ })))
const FinalCTA = lazy(() =>
  import('@/components/sections/FinalCTA').then((m) => ({ default: m.FinalCTA })),
)
const Footer = lazy(() =>
  import('@/components/layout/Footer').then((m) => ({ default: m.Footer })),
)

/** Reserves vertical space so lazy boundaries don't collapse the scroll. */
function SectionFallback() {
  return <div className="h-[70vh]" aria-hidden />
}

function Site() {
  useLenis()
  const [demoOpen, setDemoOpen] = useState(false)
  const openDemo = useCallback(() => setDemoOpen(true), [])
  const closeDemo = useCallback(() => setDemoOpen(false), [])

  return (
    <>
      <a
        href="#showcase"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[120] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <ScrollProgress />
      <MouseGlow />
      <AnimatedCursor />
      <NoiseOverlay />

      <Navbar onBookDemo={openDemo} />

      <main>
        <Hero onBookDemo={openDemo} />
        <Trust />

        <Suspense fallback={<SectionFallback />}>
          <ProductShowcase />
          <WhySchoolDeck />
          <Modules />
          <AISection />
          <WorkflowBuilder />
          <Features />
          <Pricing onBookDemo={openDemo} />
          <Testimonials />
          <FAQ onBookDemo={openDemo} />
          <FinalCTA onBookDemo={openDemo} />
        </Suspense>
      </main>

      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <Footer />
      </Suspense>

      <DemoModal open={demoOpen} onClose={closeDemo} />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Site />
    </ThemeProvider>
  )
}
