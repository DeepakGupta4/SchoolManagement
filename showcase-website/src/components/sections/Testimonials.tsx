import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Play, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TESTIMONIALS } from '@/data/site'
import { SectionHeading } from '@/components/ui/Primitives'
import { Reveal } from '@/components/ui/Reveal'
import { Orb } from '@/components/effects/Backdrop'

export function Testimonials() {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false,
  })
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => {
    if (embla) setSelected(embla.selectedScrollSnap())
  }, [embla])

  useEffect(() => {
    if (!embla) return
    onSelect()
    embla.on('select', onSelect)
    embla.on('reInit', onSelect)
  }, [embla, onSelect])

  return (
    <section className="relative overflow-hidden border-y border-[rgb(var(--glass-border)/0.07)] bg-[rgb(var(--surface-muted))] py-24 md:py-32 lg:py-40">
      <Orb className="bottom-[-10%] left-[-8%]" size={520} opacity={0.22} />

      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            align="left"
            eyebrow="Early adopters"
            title={
              <>
                What the first cohort
                <br />
                <span className="text-gradient">says out loud.</span>
              </>
            }
            className="max-w-2xl"
          />

          <Reveal delay={0.1}>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => embla?.scrollPrev()}
                aria-label="Previous testimonial"
                className="grid h-11 w-11 place-items-center rounded-xl glass text-strong transition-colors duration-300 hover:border-brand-400/40"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => embla?.scrollNext()}
                aria-label="Next testimonial"
                className="grid h-11 w-11 place-items-center rounded-xl glass text-strong transition-colors duration-300 hover:border-brand-400/40"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <div className="mt-12 overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y gap-4">
              {TESTIMONIALS.map((t, i) => (
                <article
                  key={t.name + i}
                  className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_58%] lg:flex-[0_0_40%]"
                >
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl glass p-6 transition-all duration-500 hover:-translate-y-1 hover:border-brand-500/28 md:p-8">
                    <Quote className="h-7 w-7 text-brand-500/35" fill="currentColor" />

                    <p className="mt-5 flex-1 text-[15px] leading-relaxed text-body md:text-[16px]">
                      “{t.quote}”
                    </p>

                    <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-[10.5px] font-semibold text-emerald-500">
                      {t.stat}
                    </div>

                    <div className="mt-6 flex items-center gap-3 border-t border-[rgb(var(--glass-border)/0.08)] pt-5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-600),var(--color-azure-600))] font-display text-[13px] font-bold text-white">
                        {t.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-strong">
                          {t.name}
                        </p>
                        <p className="truncate font-mono text-[10.5px] text-subtle">{t.meta}</p>
                      </div>
                      {t.video && (
                        <button
                          type="button"
                          aria-label="Play video testimonial"
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-brand-500/25 bg-brand-600/12 text-brand-500 transition-transform duration-400 group-hover:scale-110"
                        >
                          <Play className="h-3 w-3 fill-current" />
                        </button>
                      )}
                    </div>

                    {t.video && (
                      <span className="pointer-events-none absolute top-6 right-6 font-mono text-[9.5px] tracking-[0.16em] text-subtle uppercase">
                        Video · 2:14
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Dots */}
        <div className="mt-8 flex justify-center gap-1.5">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => embla?.scrollTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                i === selected
                  ? 'w-7 bg-[linear-gradient(90deg,var(--color-brand-500),var(--color-aqua-400))]'
                  : 'w-1.5 bg-[rgb(var(--glass-border)/0.2)] hover:bg-[rgb(var(--glass-border)/0.35)]',
              )}
            />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8 text-center font-mono text-[10.5px] tracking-[0.16em] text-subtle uppercase"
        >
          Founding-cohort feedback · institutions named on request
        </motion.p>
      </div>
    </section>
  )
}
