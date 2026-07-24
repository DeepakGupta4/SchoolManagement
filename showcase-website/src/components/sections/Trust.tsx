import CountUp from 'react-countup'
import { motion } from 'framer-motion'
import { ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { TRUST_STATS } from '@/data/site'
import { Marquee } from '@/components/ui/Primitives'
import { Reveal } from '@/components/ui/Reveal'
import { EASE_PREMIUM } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Launch-partner placeholders — no fabricated third-party logos. */
const PARTNER_SLOTS = [
  'Founding Partner School',
  'Launch Cohort · Pune',
  'Launch Cohort · Jaipur',
  'Group of 6 Campuses',
  'International School',
  'CBSE Senior Secondary',
  'Day-Boarding Institute',
  'Trust-run Network',
]

function PartnerSlot({ label }: { label: string }) {
  return (
    <div className="mx-3 flex h-14 shrink-0 items-center gap-3 rounded-2xl border border-dashed border-[rgb(var(--glass-border)/0.16)] px-6">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[rgb(var(--glass-border)/0.08)]">
        <span className="h-2.5 w-2.5 rounded-sm bg-[linear-gradient(135deg,var(--color-brand-500),var(--color-azure-500))] opacity-60" />
      </span>
      <span className="font-mono text-[11.5px] tracking-wide whitespace-nowrap text-subtle uppercase">
        {label}
      </span>
    </div>
  )
}

export function Trust() {
  return (
    <section className="relative border-y border-[rgb(var(--glass-border)/0.07)] py-16 md:py-20">
      <div className="container-x">
        <Reveal>
          <p className="text-center font-mono text-[11px] tracking-[0.22em] text-subtle uppercase">
            Built for modern schools · Founding cohort now onboarding
          </p>
        </Reveal>

        {/* Counters */}
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-[rgb(var(--glass-border)/0.08)] bg-[rgb(var(--glass-border)/0.08)] lg:grid-cols-4">
          {TRUST_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, delay: i * 0.09, ease: EASE_PREMIUM }}
              className={cn(
                'group relative bg-surface px-6 py-9 text-center transition-colors duration-500',
                'hover:bg-[rgb(var(--surface-muted))]',
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px scale-x-0 bg-[linear-gradient(90deg,transparent,var(--color-brand-500),transparent)] transition-transform duration-700 group-hover:scale-x-100"
              />
              <p className="font-display text-[clamp(2rem,4.4vw,3rem)] leading-none font-extrabold tracking-tight">
                <span className="text-gradient">
                  <CountUp
                    end={stat.value}
                    duration={2.6}
                    separator=","
                    enableScrollSpy
                    scrollSpyOnce
                  />
                  {stat.suffix}
                </span>
              </p>
              <p className="mt-3 text-[13.5px] font-medium text-strong">{stat.label}</p>
              <p className="mt-0.5 font-mono text-[10.5px] tracking-wide text-subtle uppercase">
                {stat.hint}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Partner marquee */}
        <div className="mt-12">
          <Marquee speed={48}>
            {PARTNER_SLOTS.map((p) => (
              <PartnerSlot key={p} label={p} />
            ))}
          </Marquee>
        </div>

        {/* Assurances */}
        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { icon: ShieldCheck, text: 'DPDP-ready · data stays in India' },
              { icon: Zap, text: '99.98% uptime across the platform' },
              { icon: Sparkles, text: 'AI never trains on your student data' },
            ].map((item) => (
              <span
                key={item.text}
                className="inline-flex items-center gap-2 text-[12.5px] text-subtle"
              >
                <item.icon className="h-3.5 w-3.5 text-brand-500" />
                {item.text}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
