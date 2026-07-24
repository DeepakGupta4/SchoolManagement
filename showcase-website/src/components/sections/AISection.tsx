import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'
import { AI_AGENTS } from '@/data/site'
import { SectionHeading, LiveDot } from '@/components/ui/Primitives'
import { Reveal } from '@/components/ui/Reveal'
import { Aurora } from '@/components/effects/Backdrop'

/** Types a string out character by character. */
function useTypewriter(text: string, speed = 22) {
  const [out, setOut] = useState('')
  useEffect(() => {
    setOut('')
    let i = 0
    const id = setInterval(() => {
      i += 1
      setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return out
}

function AIConsole({ index }: { index: number }) {
  const agent = AI_AGENTS[index]
  const typed = useTypewriter(agent.prompt, 26)
  const done = typed.length === agent.prompt.length

  return (
    <div className="relative overflow-hidden rounded-3xl glass-strong p-5 shadow-lift md:p-7">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-[rgb(var(--glass-border)/0.08)] pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--color-brand-600),var(--color-azure-600))] shadow-glow">
          <agent.icon className="h-[18px] w-[18px] text-white" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-strong">{agent.name}</p>
          <p className="truncate font-mono text-[11px] tracking-wide text-subtle uppercase">
            {agent.role}
          </p>
        </div>
        <span className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/22 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] text-emerald-500">
          <LiveDot />
          ONLINE
        </span>
      </div>

      {/* conversation */}
      <div className="mt-5 space-y-4">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-azure-600))] px-4 py-2.5 text-[13.5px] leading-relaxed text-white">
            {typed}
            {!done && <span className="ml-0.5 inline-block animate-blink">▌</span>}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {done && (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE_PREMIUM }}
              className="flex gap-3"
            >
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-600/14 text-brand-500">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl rounded-tl-md border border-[rgb(var(--glass-border)/0.08)] bg-[rgb(var(--surface-muted))] px-4 py-3">
                  <p className="text-[13.5px] leading-relaxed text-body">{agent.answer}</p>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {['Grounded in your data', 'Audit-logged', 'Never used for training'].map(
                    (chip, i) => (
                      <motion.span
                        key={chip}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.08, duration: 0.4 }}
                        className="rounded-md bg-[rgb(var(--glass-border)/0.07)] px-2 py-0.5 font-mono text-[10px] text-subtle"
                      >
                        {chip}
                      </motion.span>
                    ),
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* input */}
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-[rgb(var(--glass-border)/0.09)] bg-[rgb(var(--surface-muted))] px-3.5 py-2.5">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-500" />
        <span className="flex-1 truncate text-[12.5px] text-subtle">
          Ask {agent.name} anything about your school…
        </span>
        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-subtle" />
      </div>
    </div>
  )
}

export function AISection() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setActive((a) => (a + 1) % AI_AGENTS.length), 5200)
    return () => clearInterval(id)
  }, [paused])

  return (
    <section id="ai" className="relative scroll-mt-24 overflow-hidden py-24 md:py-32 lg:py-40">
      <Aurora intensity={0.7} />

      <div className="container-x">
        <SectionHeading
          eyebrow="The unfair advantage"
          title={
            <>
              Meet <span className="text-gradient">SchoolOS AI</span>
            </>
          }
          description="Ten role-aware copilots that read your live school data and do the work — not a chatbot bolted onto a dashboard."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10">
          {/* Agent list */}
          <Reveal>
            <div
              className="grid grid-cols-2 gap-2.5"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {AI_AGENTS.map((agent, i) => (
                <button
                  key={agent.name}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-500',
                    i === active
                      ? 'border-brand-500/40 bg-[linear-gradient(150deg,color-mix(in_oklab,var(--color-brand-600)_14%,transparent),transparent_65%)] shadow-glow'
                      : 'border-[rgb(var(--glass-border)/0.08)] bg-[rgb(var(--surface-muted))] hover:-translate-y-0.5 hover:border-brand-500/25',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-xl transition-colors duration-500',
                      i === active
                        ? 'bg-[linear-gradient(135deg,var(--color-brand-600),var(--color-azure-600))] text-white'
                        : 'bg-brand-600/10 text-brand-500',
                    )}
                  >
                    <agent.icon className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <p className="mt-3 text-[13.5px] leading-tight font-semibold text-strong">
                    {agent.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] tracking-wide text-subtle uppercase">
                    {agent.role}
                  </p>

                  {i === active && (
                    <motion.span
                      layoutId="ai-underline"
                      transition={{ duration: 0.5, ease: EASE_PREMIUM }}
                      className="absolute inset-x-3.5 bottom-0 h-[2px] rounded-full bg-[linear-gradient(90deg,var(--color-brand-500),var(--color-aqua-400))]"
                    />
                  )}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Console */}
          <Reveal delay={0.12}>
            <div
              className="lg:sticky lg:top-28"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <AIConsole index={active} />

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {[
                  { k: '6.2s', v: 'Timetable rebuild' },
                  { k: '94%', v: 'Forecast accuracy' },
                  { k: '318', v: 'Report cards / min' },
                ].map((s) => (
                  <div
                    key={s.v}
                    className="rounded-2xl border border-[rgb(var(--glass-border)/0.08)] bg-[rgb(var(--surface-muted))] p-3.5 text-center"
                  >
                    <p className="font-display text-[20px] leading-none font-bold text-gradient">
                      {s.k}
                    </p>
                    <p className="mt-1.5 font-mono text-[9.5px] tracking-wide text-subtle uppercase">
                      {s.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
