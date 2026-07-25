import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'
import { FAQS } from '@/data/site'
import { SectionHeading } from '@/components/ui/Primitives'
import { Reveal } from '@/components/ui/Reveal'
import { MagneticButton } from '@/components/ui/MagneticButton'

export function FAQ({ onBookDemo }: { onBookDemo: () => void }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="relative scroll-mt-24 py-24 md:py-32 lg:py-40">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              align="left"
              eyebrow="Questions"
              title={
                <>
                  Everything you'd ask
                  <br />
                  <span className="text-gradient">in the first meeting.</span>
                </>
              }
              description="Still unsure? Thirty minutes with our team answers most of it, including the awkward ones."
            />
            <Reveal delay={0.15}>
              <MagneticButton className="mt-7" size="md" variant="outline" onClick={onBookDemo}>
                Talk to a specialist
              </MagneticButton>
            </Reveal>
          </div>

          <div className="divide-y divide-[rgb(var(--glass-border)/0.08)] border-y border-[rgb(var(--glass-border)/0.08)]">
            {FAQS.map((faq, i) => {
              const isOpen = open === i
              return (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.6, delay: Math.min(i * 0.05, 0.3), ease: EASE_PREMIUM }}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="group flex w-full items-start justify-between gap-5 py-5 text-left"
                    >
                      <span
                        className={cn(
                          'text-[15.5px] leading-snug font-semibold transition-colors duration-400 md:text-[16.5px]',
                          isOpen ? 'text-strong' : 'text-body group-hover:text-strong',
                        )}
                      >
                        {faq.q}
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all duration-500',
                          isOpen
                            ? 'rotate-[135deg] border-brand-500/40 bg-brand-600/14 text-brand-500'
                            : 'border-[rgb(var(--glass-border)/0.12)] text-subtle group-hover:border-brand-500/30',
                        )}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: EASE_PREMIUM }}
                        className="overflow-hidden"
                      >
                        <p className="pr-10 pb-6 text-[14px] leading-relaxed text-subtle md:text-[15px]">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
