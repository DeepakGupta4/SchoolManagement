import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChartNoAxesCombined, ClipboardCheck, Receipt, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'
import { SectionHeading } from '@/components/ui/Primitives'
import { LaptopFrame, PhoneFrame, TabletFrame } from '@/components/product/Devices'
import { DashboardUI, PhoneUI } from '@/components/product/DashboardUI'
import { Orb } from '@/components/effects/Backdrop'

const SCENES = [
  {
    key: 'overview',
    label: 'Command Centre',
    icon: ChartNoAxesCombined,
    caption: 'Every number on this screen recomputes the moment data lands.',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    icon: ClipboardCheck,
    caption: 'Face recognition clears a class of 44 in under four seconds.',
  },
  {
    key: 'fees',
    label: 'Fees & Finance',
    icon: Receipt,
    caption: 'Collections, dues and reconciliation on a single ledger.',
  },
  {
    key: 'ai',
    label: 'AI Suite',
    icon: Sparkles,
    caption: 'Ten copilots that read your data and act on it.',
  },
]

export function ProductShowcase() {
  const sectionRef = useRef<HTMLElement>(null)
  const [scene, setScene] = useState(0)

  // Autoplay the tour, pausing whenever the visitor takes over.
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setScene((s) => (s + 1) % SCENES.length), 4200)
    return () => clearInterval(id)
  }, [paused])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const rotateX = useTransform(scrollYProgress, [0, 0.42, 1], [16, 0, -6])
  const scale = useTransform(scrollYProgress, [0, 0.42, 1], [0.9, 1, 0.97])
  const phoneY = useTransform(scrollYProgress, [0, 1], [90, -70])
  const tabletY = useTransform(scrollYProgress, [0, 1], [60, -40])

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative scroll-mt-24 overflow-hidden py-24 md:py-32 lg:py-40"
    >
      <Orb className="top-[10%] -left-[10%]" size={620} opacity={0.28} />
      <Orb
        className="right-[-12%] bottom-[8%]"
        size={560}
        color="var(--color-azure-600)"
        opacity={0.24}
      />

      <div className="container-x">
        <SectionHeading
          eyebrow="Product tour"
          title={
            <>
              One console.{' '}
              <span className="text-gradient">Every screen your school lives in.</span>
            </>
          }
          description="Not a screenshot gallery — this is the actual interface, rendered live and running the same components your staff will use every morning."
        />

        {/* Scene switcher */}
        <div className="mt-11 flex flex-wrap justify-center gap-2">
          {SCENES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setScene(i)
                setPaused(true)
              }}
              className={cn(
                'group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-400',
                i === scene ? 'text-white' : 'glass text-body hover:text-strong',
              )}
            >
              {i === scene && (
                <motion.span
                  layoutId="scene-pill"
                  transition={{ duration: 0.5, ease: EASE_PREMIUM }}
                  className="absolute inset-0 -z-10 rounded-full bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-azure-600))]"
                />
              )}
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
              {i === scene && !paused && (
                <motion.span
                  key={scene}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 4.2, ease: 'linear' }}
                  className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-white/60"
                />
              )}
            </button>
          ))}
        </div>

        {/* Stage */}
        <div className="relative mt-14 perspective-1200 md:mt-16">
          <motion.div style={{ rotateX, scale }} className="relative preserve-3d">
            <LaptopFrame className="mx-auto max-w-5xl">
              <div className="relative h-full w-full">
                <DashboardUI />
                {/* scene tint so switching reads as a change of context */}
                <motion.div
                  key={scene}
                  initial={{ opacity: 0.35 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: EASE_PREMIUM }}
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,var(--color-brand-600),var(--color-azure-600))]"
                />
              </div>
            </LaptopFrame>

            {/* Phone */}
            <motion.div
              style={{ y: phoneY }}
              className="absolute -right-2 -bottom-10 z-20 hidden w-[168px] md:block lg:-right-6 lg:w-[196px]"
            >
              <PhoneFrame>
                <PhoneUI />
              </PhoneFrame>
            </motion.div>

            {/* Tablet */}
            <motion.div
              style={{ y: tabletY }}
              className="absolute -bottom-4 -left-4 z-10 hidden w-[240px] lg:block xl:-left-12 xl:w-[290px]"
            >
              <TabletFrame>
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <DashboardUI compact />
                </div>
              </TabletFrame>
            </motion.div>
          </motion.div>
        </div>

        <motion.p
          key={SCENES[scene].key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_PREMIUM }}
          className="mt-16 text-center text-[14.5px] text-subtle md:mt-14"
        >
          {SCENES[scene].caption}
        </motion.p>
      </div>
    </section>
  )
}
