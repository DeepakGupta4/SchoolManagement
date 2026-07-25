import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, GripVertical, Plus, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'
import { WORKFLOW_NODES } from '@/data/site'
import { SectionHeading } from '@/components/ui/Primitives'
import { Reveal } from '@/components/ui/Reveal'

const TONE: Record<string, { bg: string; fg: string; line: string }> = {
  brand: {
    bg: 'color-mix(in oklab, var(--color-brand-600) 14%, transparent)',
    fg: 'var(--color-brand-500)',
    line: 'var(--color-brand-500)',
  },
  azure: {
    bg: 'color-mix(in oklab, var(--color-azure-600) 14%, transparent)',
    fg: 'var(--color-azure-500)',
    line: 'var(--color-azure-500)',
  },
  aqua: {
    bg: 'color-mix(in oklab, var(--color-aqua-500) 14%, transparent)',
    fg: 'var(--color-aqua-500)',
    line: 'var(--color-aqua-400)',
  },
}

const PALETTE = [
  'When fee is overdue',
  'When attendance < 75%',
  'On exam result publish',
  'Every Monday 08:00',
  'Send WhatsApp',
  'Create task',
  'Update ledger',
  'Call webhook',
]

/** Animated connector between two stacked nodes. */
function Connector({ delay, color }: { delay: number; color: string }) {
  return (
    <div className="relative flex h-14 justify-center md:h-16">
      <svg className="h-full w-8 overflow-visible" viewBox="0 0 32 64" aria-hidden>
        <motion.line
          x1="16"
          y1="0"
          x2="16"
          y2="64"
          stroke="rgb(var(--glass-border) / 0.16)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay, ease: EASE_PREMIUM }}
        />
        <motion.line
          x1="16"
          y1="0"
          x2="16"
          y2="64"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 10"
          className="animate-dash"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.9 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: delay + 0.3 }}
        />
        {/* travelling pulse */}
        <motion.circle
          r="3"
          cx="16"
          fill={color}
          initial={{ cy: 0, opacity: 0 }}
          whileInView={{ cy: [0, 64], opacity: [0, 1, 0] }}
          viewport={{ once: true }}
          transition={{
            duration: 1.6,
            delay: delay + 0.4,
            repeat: Infinity,
            repeatDelay: 1.4,
            ease: 'easeInOut',
          }}
        />
      </svg>
    </div>
  )
}

export function WorkflowBuilder() {
  const [ran, setRan] = useState(-1)

  // Cycle a "run" highlight down the chain so the canvas reads as executing.
  useEffect(() => {
    const id = setInterval(() => {
      setRan((r) => (r + 1) % (WORKFLOW_NODES.length + 2))
    }, 900)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      id="workflow"
      className="relative scroll-mt-24 overflow-hidden border-y border-[rgb(var(--glass-border)/0.07)] bg-[rgb(var(--surface-muted))] py-24 md:py-32 lg:py-40"
    >
      <div className="container-x">
        <SectionHeading
          eyebrow="Workflow Builder"
          title={
            <>
              Automate the busywork.{' '}
              <span className="text-gradient">Without writing a line of code.</span>
            </>
          }
          description="Drag a trigger, drop a few actions, publish. Every module in SchoolDeck is available as a block — so a single admission can fan out into fees, messages and certificates automatically."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-8">
          {/* Palette */}
          <Reveal>
            <div className="rounded-3xl border border-[rgb(var(--glass-border)/0.08)] bg-surface p-4 lg:sticky lg:top-28">
              <p className="mb-3 flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] text-subtle uppercase">
                <Zap className="h-3 w-3 text-brand-500" />
                Blocks
              </p>
              <div className="space-y-1.5">
                {PALETTE.map((p, i) => (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.05, ease: EASE_PREMIUM }}
                    whileHover={{ x: 4 }}
                    className="flex cursor-grab items-center gap-2 rounded-xl border border-[rgb(var(--glass-border)/0.07)] bg-[rgb(var(--surface-muted))] px-2.5 py-2 transition-colors duration-300 hover:border-brand-500/25 active:cursor-grabbing"
                  >
                    <GripVertical className="h-3 w-3 shrink-0 text-subtle" />
                    <span className="truncate text-[12px] text-body">{p}</span>
                  </motion.div>
                ))}
              </div>
              <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[rgb(var(--glass-border)/0.16)] py-2 text-[12px] text-subtle transition-colors duration-300 hover:border-brand-500/35 hover:text-strong">
                <Plus className="h-3 w-3" />
                Browse 100+ blocks
              </button>
            </div>
          </Reveal>

          {/* Canvas */}
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl border border-[rgb(var(--glass-border)/0.08)] bg-surface p-6 md:p-10">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 grid-lines opacity-70"
                style={{ backgroundSize: '28px 28px' }}
              />

              <div className="relative mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-strong">New Admission → Onboarded</p>
                  <p className="font-mono text-[10.5px] text-subtle">
                    v3 · published · 1,284 runs this term
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/22 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  ACTIVE
                </span>
              </div>

              <div className="relative flex flex-col items-center">
                {WORKFLOW_NODES.map((node, i) => {
                  const tone = TONE[node.tone]
                  const isDone = ran > i
                  return (
                    <div key={node.title} className="flex w-full flex-col items-center">
                      <motion.div
                        initial={{ opacity: 0, y: 26, scale: 0.94 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: i * 0.16, ease: EASE_PREMIUM }}
                        whileHover={{ y: -3 }}
                        className={cn(
                          'relative w-full max-w-md rounded-2xl border bg-elevated p-4 transition-[border-color,box-shadow] duration-500',
                          isDone
                            ? 'border-brand-500/40 shadow-glow'
                            : 'border-[rgb(var(--glass-border)/0.1)]',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                            style={{ background: tone.bg, color: tone.fg }}
                          >
                            <node.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="rounded-md px-1.5 py-0.5 font-mono text-[9.5px] font-semibold tracking-wide uppercase"
                                style={{ background: tone.bg, color: tone.fg }}
                              >
                                {node.kind}
                              </span>
                              <span className="font-mono text-[9.5px] text-subtle">
                                step {i + 1}
                              </span>
                            </div>
                            <p className="mt-1.5 text-[14px] font-semibold text-strong">
                              {node.title}
                            </p>
                            <p className="mt-0.5 text-[12px] leading-snug text-subtle">
                              {node.detail}
                            </p>
                          </div>
                          <motion.span
                            animate={{
                              scale: isDone ? 1 : 0.4,
                              opacity: isDone ? 1 : 0,
                            }}
                            transition={{ duration: 0.35, ease: EASE_PREMIUM }}
                            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </motion.span>
                        </div>
                      </motion.div>

                      {i < WORKFLOW_NODES.length - 1 && (
                        <Connector delay={0.3 + i * 0.16} color={tone.line} />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="relative mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[rgb(var(--glass-border)/0.07)] pt-5">
                {[
                  ['Avg. run time', '1.4s'],
                  ['Success rate', '99.7%'],
                  ['Staff hours saved', '312 / term'],
                ].map(([k, v]) => (
                  <span key={k} className="text-[12px] text-subtle">
                    {k} <span className="font-semibold text-strong">{v}</span>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
