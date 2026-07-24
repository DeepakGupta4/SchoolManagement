import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'
import { PLANS } from '@/data/site'
import { SectionHeading } from '@/components/ui/Primitives'
import { Reveal } from '@/components/ui/Reveal'
import { MagneticButton } from '@/components/ui/MagneticButton'

export function Pricing({ onBookDemo }: { onBookDemo: () => void }) {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="pricing" className="relative scroll-mt-24 overflow-hidden py-24 md:py-32 lg:py-40">
      <div className="container-x">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Priced per student.{' '}
              <span className="text-gradient">Never per module.</span>
            </>
          }
          description="No setup fee, no per-feature upsell, no charge for parent or staff accounts. Migration is on us."
        />

        {/* Billing toggle */}
        <Reveal delay={0.08}>
          <div className="mt-11 flex items-center justify-center gap-3">
            <span
              className={cn(
                'text-[13.5px] font-medium transition-colors duration-300',
                annual ? 'text-subtle' : 'text-strong',
              )}
            >
              Monthly
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={annual}
              aria-label="Toggle annual billing"
              onClick={() => setAnnual((v) => !v)}
              className={cn(
                'relative h-7 w-12 rounded-full border transition-colors duration-400',
                annual
                  ? 'border-brand-500/40 bg-brand-600/25'
                  : 'border-[rgb(var(--glass-border)/0.14)] bg-[rgb(var(--glass-border)/0.08)]',
              )}
            >
              <motion.span
                animate={{ x: annual ? 22 : 3 }}
                transition={{ duration: 0.4, ease: EASE_PREMIUM }}
                className="absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 rounded-full bg-[linear-gradient(135deg,var(--color-brand-500),var(--color-azure-500))] shadow"
              />
            </button>
            <span
              className={cn(
                'text-[13.5px] font-medium transition-colors duration-300',
                annual ? 'text-strong' : 'text-subtle',
              )}
            >
              Annual
            </span>
            <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-emerald-500">
              SAVE 20%
            </span>
          </div>
        </Reveal>

        {/* Plans */}
        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {PLANS.map((plan, i) => {
            const numeric = plan.price.startsWith('₹')
            const monthly = numeric
              ? `₹${Math.round(Number(plan.price.replace('₹', '')) * 1.25)}`
              : plan.price
            const shown = annual ? plan.price : monthly

            return (
              <motion.article
                key={plan.name}
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: EASE_PREMIUM }}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-3xl border p-6 transition-all duration-500 md:p-7',
                  plan.featured
                    ? 'border-brand-500/35 bg-[linear-gradient(165deg,color-mix(in_oklab,var(--color-brand-600)_12%,transparent),transparent_55%)] shadow-glow lg:-my-3 lg:py-9'
                    : 'border-[rgb(var(--glass-border)/0.09)] bg-[rgb(var(--surface-muted))] hover:-translate-y-1 hover:border-brand-500/25',
                )}
              >
                {plan.featured && (
                  <>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-brand-500/25 blur-3xl"
                    />
                    <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-azure-600))] px-3 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-white uppercase">
                      <Sparkles className="h-3 w-3" />
                      Most chosen
                    </span>
                  </>
                )}

                <h3 className="font-display text-[19px] font-bold text-strong">{plan.name}</h3>
                <p className="mt-1.5 min-h-[38px] text-[12.5px] leading-snug text-subtle">
                  {plan.tagline}
                </p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <motion.span
                    key={shown}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="font-display text-[32px] leading-none font-extrabold text-strong"
                  >
                    {shown}
                  </motion.span>
                  {plan.unit && (
                    <span className="text-[11.5px] text-subtle">{plan.unit}</span>
                  )}
                </div>
                <p className="mt-1.5 font-mono text-[10px] tracking-wide text-subtle uppercase">
                  {annual ? plan.annualNote : 'Billed monthly · cancel anytime'}
                </p>

                <MagneticButton
                  variant={plan.featured ? 'primary' : 'outline'}
                  size="md"
                  className="mt-6 w-full"
                  onClick={onBookDemo}
                  strength={0.18}
                >
                  {plan.cta}
                </MagneticButton>

                <ul className="mt-6 space-y-2.5 border-t border-[rgb(var(--glass-border)/0.07)] pt-5">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          'mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full',
                          plan.featured
                            ? 'bg-brand-600/22 text-brand-500'
                            : 'bg-[rgb(var(--glass-border)/0.09)] text-subtle',
                        )}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={3.2} />
                      </span>
                      <span className="text-[12.5px] leading-snug text-body">{h}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            )
          })}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-10 text-center text-[13px] text-subtle">
            All plans include unlimited staff and parent accounts, mobile apps, free data migration
            and onboarding training.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
