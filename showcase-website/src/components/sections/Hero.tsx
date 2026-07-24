import { useRef } from 'react'
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Play,
  ScanFace,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'
import { Aurora, GridBackdrop } from '@/components/effects/Backdrop'
import { ParticleField } from '@/components/effects/ParticleField'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { LiveDot } from '@/components/ui/Primitives'
import { DashboardUI } from '@/components/product/DashboardUI'
import { ScaledPreview } from '@/components/product/ScaledPreview'
import { useHasPointer } from '@/hooks/useMouse'
import { scrollToId } from '@/hooks/useLenis'

const SUB_WORDS = [
  'Admissions',
  'Academics',
  'Attendance',
  'Fees',
  'Communication',
  'AI',
  'Analytics',
]

/* ------------------------------------------------------- Floating widget */

function FloatingWidget({
  className,
  delay = 0,
  depth = 1,
  children,
  px,
  py,
}: {
  className?: string
  delay?: number
  depth?: number
  children: React.ReactNode
  px: ReturnType<typeof useMotionValue<number>>
  py: ReturnType<typeof useMotionValue<number>>
}) {
  const x = useTransform(px, (v) => v * 26 * depth)
  const y = useTransform(py, (v) => v * 18 * depth)

  return (
    <motion.div
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.86, filter: 'blur(12px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1, delay, ease: EASE_PREMIUM }}
      className={cn('absolute z-20 hidden md:block', className)}
    >
      <div
        className="rounded-2xl glass-strong p-3 shadow-lift"
        style={{ animation: `float ${6 + depth * 1.6}s ease-in-out ${delay}s infinite` }}
      >
        {children}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ Hero */

export function Hero({ onBookDemo }: { onBookDemo: () => void }) {
  const sectionRef = useRef<HTMLElement>(null)
  const hasPointer = useHasPointer()

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const px = useSpring(rawX, { stiffness: 60, damping: 20, mass: 0.8 })
  const py = useSpring(rawY, { stiffness: 60, damping: 20, mass: 0.8 })

  // Scroll parallax on the whole stage.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.94])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 60])
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  const tiltX = useTransform(py, (v) => v * -7)
  const tiltY = useTransform(px, (v) => v * 9)

  const onPointerMove = (e: React.PointerEvent) => {
    if (!hasPointer || !sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    rawX.set((e.clientX - rect.left) / rect.width - 0.5)
    rawY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section
      id="top"
      ref={sectionRef}
      onPointerMove={onPointerMove}
      className="relative isolate overflow-hidden pt-28 pb-20 md:pt-32 md:pb-28 lg:pt-36 lg:pb-32"
    >
      <Aurora />
      <GridBackdrop />
      <ParticleField />

      {/* Bottom fade into the next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-[linear-gradient(180deg,transparent,rgb(var(--surface)))]" />

      <motion.div style={{ opacity: fade }} className="container-x">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          {/* ------------------------------------------------------- Copy */}
          <motion.div style={{ y: copyY }} className="relative z-10 max-w-2xl">
            <motion.a
              href="#ai"
              onClick={(e) => {
                e.preventDefault()
                scrollToId('ai')
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASE_PREMIUM }}
              className="group inline-flex items-center gap-2.5 rounded-full glass py-1.5 pr-3 pl-1.5 transition-colors duration-300 hover:border-brand-400/40"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-azure-600))] px-2.5 py-1 text-[10.5px] font-bold tracking-wide text-white uppercase">
                <Sparkles className="h-3 w-3" />
                New
              </span>
              <span className="text-[13px] font-medium text-body">
                SchoolOS AI — 10 copilots now live
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-subtle transition-transform duration-300 group-hover:translate-x-0.5" />
            </motion.a>

            <h1 className="mt-7 font-display text-[clamp(2.25rem,4.6vw,3.5rem)] leading-[1.05] font-extrabold tracking-[-0.04em]">
              {['Building', "India's", 'Most', 'Advanced'].map((word, i) => (
                <span key={word} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                  <motion.span
                    initial={{ y: '110%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    transition={{
                      duration: 1.1,
                      delay: 0.2 + i * 0.075,
                      ease: EASE_PREMIUM,
                    }}
                    className="inline-block text-gradient-soft"
                  >
                    {word}&nbsp;
                  </motion.span>
                </span>
              ))}
              <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                <motion.span
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 1.1, delay: 0.5, ease: EASE_PREMIUM }}
                  className="inline-block bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-azure-600)_45%,var(--color-aqua-400))] bg-[length:200%_auto] bg-clip-text text-transparent"
                  style={{ animation: 'shimmer 6s linear infinite' }}
                >
                  School Operating System
                </motion.span>
              </span>
            </h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.62, ease: EASE_PREMIUM }}
              className="mt-7"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                {SUB_WORDS.map((w, i) => (
                  <motion.span
                    key={w}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 + i * 0.06 }}
                    className="rounded-lg border border-[rgb(var(--glass-border)/0.1)] bg-[rgb(var(--glass-bg)/var(--glass-alpha))] px-2.5 py-1 font-mono text-[11.5px] font-medium tracking-tight text-body"
                  >
                    {w}
                  </motion.span>
                ))}
              </div>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-subtle md:text-[17.5px]">
                Everything schools need — in{' '}
                <span className="font-semibold text-strong">one intelligent platform</span>. 100+
                native modules, an AI suite that actually runs the operation, and analytics your
                board will read twice.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.78, ease: EASE_PREMIUM }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <MagneticButton
                size="lg"
                onClick={onBookDemo}
                icon={<ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
              >
                Book Live Demo
              </MagneticButton>
              <MagneticButton
                size="lg"
                variant="outline"
                onClick={() => scrollToId('showcase')}
                icon={
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600/15">
                    <Play className="h-2.5 w-2.5 fill-current text-brand-500" />
                  </span>
                }
              >
                Watch Product Tour
              </MagneticButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.95 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-subtle"
            >
              {['14-day implementation', 'Free data migration', 'No setup fee'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ------------------------------------------------------ Stage */}
          <motion.div
            style={{ y: stageY, scale: stageScale }}
            className="relative perspective-1200"
          >
            <motion.div
              style={{ rotateX: tiltX, rotateY: tiltY }}
              initial={{ opacity: 0, y: 60, rotateX: 18, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.4, delay: 0.35, ease: EASE_PREMIUM }}
              className="relative preserve-3d"
            >
              {/* Glow beneath the console */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] blur-3xl"
                style={{
                  background:
                    'radial-gradient(60% 55% at 50% 45%, color-mix(in oklab, var(--color-brand-600) 40%, transparent), transparent 70%)',
                }}
              />

              <div className="relative overflow-hidden rounded-[20px] glass-strong p-2 shadow-lift">
                <ScaledPreview className="w-full rounded-[14px]">
                  <DashboardUI />
                </ScaledPreview>
              </div>

              {/* -------------------------------------------- Widgets */}
              <FloatingWidget
                px={px}
                py={py}
                depth={1.5}
                delay={0.9}
                className="-top-6 -left-6 lg:-left-10"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600/15 text-brand-500">
                    <ScanFace className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] tracking-wide text-subtle uppercase">
                      Face attendance
                    </p>
                    <p className="font-display text-[15px] leading-tight font-bold text-strong">
                      96.2%
                      <span className="ml-1.5 font-mono text-[10px] font-medium text-emerald-500">
                        +1.8%
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {[92, 96, 88, 99, 94, 97, 96].map((v, i) => (
                    <motion.span
                      key={i}
                      initial={{ height: 2 }}
                      animate={{ height: (v / 100) * 22 }}
                      transition={{ duration: 0.8, delay: 1.2 + i * 0.06, ease: EASE_PREMIUM }}
                      className="w-1.5 rounded-full bg-[linear-gradient(180deg,var(--color-brand-400),var(--color-brand-600))]"
                    />
                  ))}
                </div>
              </FloatingWidget>

              <FloatingWidget
                px={px}
                py={py}
                depth={2.2}
                delay={1.15}
                className="-bottom-12 -left-4 lg:-left-10"
              >
                <div className="w-[186px]">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-[linear-gradient(135deg,var(--color-brand-600),var(--color-azure-600))]">
                      <Sparkles className="h-3 w-3 text-white" />
                    </span>
                    <p className="text-[11px] font-semibold text-strong">SchoolOS AI</p>
                    <LiveDot className="ml-auto" />
                  </div>
                  <p className="text-[10.5px] leading-snug text-subtle">
                    <span className="text-strong">62 families</span> likely to miss the Nov
                    instalment. Reminders drafted.
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <span className="rounded-md bg-brand-600/12 px-1.5 py-0.5 font-mono text-[9px] text-brand-500">
                      94% conf.
                    </span>
                    <span className="rounded-md bg-emerald-500/12 px-1.5 py-0.5 font-mono text-[9px] text-emerald-500">
                      ₹18.6L
                    </span>
                  </div>
                </div>
              </FloatingWidget>

              <FloatingWidget
                px={px}
                py={py}
                depth={1.8}
                delay={1.05}
                className="top-[58%] -right-4 lg:-right-9"
              >
                <div className="w-[168px]">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] tracking-wide text-subtle uppercase">Collection</p>
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  </div>
                  <p className="font-display text-[19px] leading-tight font-bold text-strong">
                    ₹2.84 Cr
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgb(var(--glass-border)/0.12)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '86%' }}
                      transition={{ duration: 1.5, delay: 1.4, ease: EASE_PREMIUM }}
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-brand-500),var(--color-aqua-400))]"
                    />
                  </div>
                  <p className="mt-1 font-mono text-[9px] text-subtle">86% of term target</p>
                </div>
              </FloatingWidget>

              <FloatingWidget
                px={px}
                py={py}
                depth={2.6}
                delay={1.3}
                className="-top-8 -right-4 lg:-right-9"
              >
                <div className="flex w-[190px] items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-aqua-500/15 text-aqua-500">
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold text-strong">
                      Sent to 2,412 parents
                    </p>
                    <p className="text-[9.5px] leading-snug text-subtle">
                      WhatsApp · delivered 98.4%
                    </p>
                  </div>
                </div>
              </FloatingWidget>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        style={{ opacity: fade }}
        className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center lg:flex"
      >
        <div className="flex h-9 w-[22px] items-start justify-center rounded-full border border-[rgb(var(--glass-border)/0.18)] p-1.5">
          <motion.span
            animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="h-1.5 w-1 rounded-full bg-brand-500"
          />
        </div>
      </motion.div>
    </section>
  )
}
