import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, CalendarCheck, CheckCircle2 } from 'lucide-react'
import { EASE_PREMIUM } from '@/lib/motion'
import { Aurora } from '@/components/effects/Backdrop'
import { ParticleField } from '@/components/effects/ParticleField'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { Reveal } from '@/components/ui/Reveal'

export function FinalCTA({ onBookDemo }: { onBookDemo: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [70, -70])

  return (
    <section ref={ref} className="relative isolate overflow-hidden py-24 md:py-32 lg:py-40">
      <div className="container-x">
        <motion.div style={{ y }} className="relative">
          <div className="relative overflow-hidden rounded-[32px] border border-[rgb(var(--glass-border)/0.1)] px-6 py-16 text-center md:px-14 md:py-24">
            <Aurora intensity={1.2} />
            <ParticleField density={0.00006} linkDistance={110} />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[rgb(var(--surface)/0.55)] backdrop-blur-2xl" />

            <Reveal y={20} duration={0.7}>
              <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 font-mono text-[11px] tracking-[0.16em] text-subtle uppercase">
                <CalendarCheck className="h-3.5 w-3.5 text-brand-500" />
                30-minute demo · no obligation
              </span>
            </Reveal>

            <motion.h2
              initial={{ opacity: 0, y: 34, filter: 'blur(12px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.08, ease: EASE_PREMIUM }}
              className="mx-auto mt-7 max-w-3xl text-[clamp(2.25rem,6vw,4.25rem)] leading-[1.03] font-extrabold tracking-[-0.04em]"
            >
              Ready to transform
              <br />
              <span className="text-gradient">your school?</span>
            </motion.h2>

            <Reveal delay={0.16}>
              <p className="mx-auto mt-6 max-w-xl text-[15.5px] leading-relaxed text-subtle md:text-[17px]">
                We'll map your current process, show you the exact screens your staff will use, and
                give you a migration plan before you commit to anything.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <MagneticButton
                  size="lg"
                  onClick={onBookDemo}
                  icon={
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  }
                >
                  Book Live Demo
                </MagneticButton>
                <MagneticButton size="lg" variant="outline" href="mailto:hello@schooldeck.com">
                  Email the founders
                </MagneticButton>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 text-[12.5px] text-subtle">
                {[
                  'Live in 14 days',
                  'Free migration from any ERP',
                  'Cancel anytime',
                  'Data stays in India',
                ].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
