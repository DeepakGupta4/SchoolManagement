import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'
import { PROBLEMS, SOLUTIONS } from '@/data/site'
import { SectionHeading } from '@/components/ui/Primitives'
import { Reveal } from '@/components/ui/Reveal'

type Mode = 'before' | 'after'

export function WhySchoolOS() {
  const [mode, setMode] = useState<Mode>('before')
  const items = mode === 'before' ? PROBLEMS : SOLUTIONS
  const isAfter = mode === 'after'

  return (
    <section id="why" className="relative scroll-mt-24 overflow-hidden py-24 md:py-32 lg:py-40">
      <div className="container-x">
        <SectionHeading
          eyebrow="Why BuildSchoolOS"
          title={
            <>
              Your school is not short on effort.
              <br />
              <span className="text-gradient">It is short on a system.</span>
            </>
          }
          description="Four problems show up in almost every campus we walk into. Flip the switch to see what replaces them."
        />

        {/* Before / After switch */}
        <Reveal delay={0.1}>
          <div className="mt-12 flex justify-center">
            <div
              className="relative inline-flex rounded-2xl glass p-1.5"
              role="tablist"
              aria-label="Compare before and after"
            >
              {(['before', 'after'] as Mode[]).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'relative z-10 rounded-xl px-6 py-2.5 text-[13.5px] font-semibold transition-colors duration-400',
                    mode === m ? 'text-white' : 'text-body hover:text-strong',
                  )}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="why-pill"
                      transition={{ duration: 0.55, ease: EASE_PREMIUM }}
                      className={cn(
                        'absolute inset-0 -z-10 rounded-xl',
                        m === 'before'
                          ? 'bg-[linear-gradient(100deg,#7f1d1d,#b91c1c)]'
                          : 'bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-azure-600))]',
                      )}
                    />
                  )}
                  {m === 'before' ? 'Without a system' : 'With BuildSchoolOS'}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Cards */}
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {items.map((item, i) => (
            <AnimatePresence mode="wait" key={i}>
              <motion.article
                key={`${mode}-${i}`}
                initial={{ opacity: 0, y: 28, rotateX: -8, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -18, filter: 'blur(6px)' }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: EASE_PREMIUM }}
                className={cn(
                  'group relative overflow-hidden rounded-3xl border p-7 transition-colors duration-500 md:p-8',
                  isAfter
                    ? 'border-brand-500/18 bg-[linear-gradient(150deg,color-mix(in_oklab,var(--color-brand-600)_9%,transparent),transparent_58%)] hover:border-brand-500/35'
                    : 'border-[rgb(var(--glass-border)/0.09)] bg-[rgb(var(--surface-muted))] hover:border-red-500/25',
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl transition-opacity duration-700',
                    isAfter ? 'bg-brand-500/18' : 'bg-red-500/10',
                    'opacity-0 group-hover:opacity-100',
                  )}
                />

                <div className="flex items-start justify-between gap-4">
                  <span
                    className={cn(
                      'grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-colors duration-500',
                      isAfter
                        ? 'bg-brand-600/14 text-brand-500'
                        : 'bg-red-500/10 text-red-500/90',
                    )}
                  >
                    <item.icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] font-semibold',
                      isAfter
                        ? 'bg-emerald-500/12 text-emerald-500'
                        : 'bg-red-500/10 text-red-500/90',
                    )}
                  >
                    {isAfter ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {item.metric}
                  </span>
                </div>

                <h3 className="mt-6 text-[19px] leading-snug font-semibold md:text-[21px]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-subtle">{item.body}</p>

                {isAfter && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.08, duration: 0.5 }}
                    className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-brand-500 uppercase"
                  >
                    Automated end to end
                    <ArrowRight className="h-3 w-3" />
                  </motion.div>
                )}
              </motion.article>
            </AnimatePresence>
          ))}
        </div>
      </div>
    </section>
  )
}
