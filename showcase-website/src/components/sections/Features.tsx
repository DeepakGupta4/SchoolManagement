import { motion } from 'framer-motion'
import { FEATURES, INTEGRATIONS } from '@/data/site'
import { EASE_PREMIUM } from '@/lib/motion'
import { SectionHeading, Marquee } from '@/components/ui/Primitives'
import { GlassCard } from '@/components/ui/GlassCard'
import { Reveal } from '@/components/ui/Reveal'
import { Orb } from '@/components/effects/Backdrop'

/** Monogram tile — real vendor marks aren't ours to reproduce. */
function IntegrationTile({ name, tag }: { name: string; tag: string }) {
  const initials = name
    .split(/[\s/]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

  return (
    <div className="group mx-2 flex w-[228px] shrink-0 items-center gap-3 rounded-2xl border border-[rgb(var(--glass-border)/0.08)] bg-[rgb(var(--surface-muted))] p-3.5 transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-500/28">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-brand-600)_18%,transparent),color-mix(in_oklab,var(--color-azure-600)_18%,transparent))] font-display text-[13px] font-bold text-strong">
        {initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-semibold text-strong">{name}</span>
        <span className="block font-mono text-[10px] tracking-wide text-subtle uppercase">
          {tag}
        </span>
      </span>
    </div>
  )
}

export function Features() {
  return (
    <section
      id="features"
      className="relative scroll-mt-24 overflow-hidden py-24 md:py-32 lg:py-40"
    >
      <Orb className="top-[20%] right-[-14%]" size={560} color="var(--color-aqua-500)" opacity={0.2} />

      <div className="container-x">
        <SectionHeading
          eyebrow="Platform capabilities"
          title={
            <>
              Enterprise foundations,
              <br />
              <span className="text-gradient">consumer-grade polish.</span>
            </>
          }
          description="The parts nobody demos but everybody depends on: security, uptime, offline resilience and open APIs."
        />

        <div className="mt-14 grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, delay: (i % 3) * 0.08, ease: EASE_PREMIUM }}
            >
              <GlassCard tilt={6} className="h-full p-6 md:p-7">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600/12 text-brand-500 transition-transform duration-500 group-hover:scale-110">
                  <f.icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <h3 className="mt-5 text-[17px] font-semibold">{f.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-subtle">{f.body}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Integrations */}
        <div id="integrations" className="mt-24 scroll-mt-24 md:mt-32">
          <Reveal>
            <div className="text-center">
              <h3 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold">
                Plays well with everything you already run
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-[14.5px] text-subtle">
                Payments, meetings, identity, messaging and hardware, connected natively, not
                through a brittle middle layer.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 space-y-3">
            <Marquee speed={44}>
              {INTEGRATIONS.slice(0, 6).map((it) => (
                <IntegrationTile key={it.name} {...it} />
              ))}
            </Marquee>
            <Marquee speed={52} reverse>
              {INTEGRATIONS.slice(6).map((it) => (
                <IntegrationTile key={it.name} {...it} />
              ))}
            </Marquee>
          </div>

          <Reveal delay={0.1}>
            <p className="mt-8 text-center text-[13px] text-subtle">
              Need something else? The open REST &amp; GraphQL API and webhooks cover the rest.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
