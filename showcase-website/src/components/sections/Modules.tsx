import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'
import { MODULES, MODULE_CATEGORIES, type ModuleCategory } from '@/data/site'
import { SectionHeading } from '@/components/ui/Primitives'
import { Reveal } from '@/components/ui/Reveal'
import { Orb } from '@/components/effects/Backdrop'

type Filter = 'All' | ModuleCategory

const CATEGORY_TINT: Record<ModuleCategory, string> = {
  People: 'var(--color-brand-500)',
  Academics: 'var(--color-azure-500)',
  Finance: 'var(--color-aqua-500)',
  Operations: 'var(--color-brand-400)',
  Intelligence: 'var(--color-azure-400)',
  Platform: 'var(--color-aqua-400)',
}

/** Featured modules lead each view; the rest stay behind a single expand. */
const COLLAPSED_COUNT = 24

export function Modules() {
  const [filter, setFilter] = useState<Filter>('All')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MODULES.filter((m) => {
      const matchesCategory = filter === 'All' || m.category === filter
      const matchesQuery = !q || m.name.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    }).sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
  }, [filter, query])

  const searching = query.trim().length > 0
  const showAll = expanded || searching
  const visible = showAll ? matches : matches.slice(0, COLLAPSED_COUNT)
  const hidden = matches.length - visible.length

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([['All', MODULES.length]])
    for (const c of MODULE_CATEGORIES) {
      map.set(c, MODULES.filter((m) => m.category === c).length)
    }
    return map
  }, [])

  return (
    <section
      id="modules"
      className="relative scroll-mt-24 overflow-hidden border-y border-[rgb(var(--glass-border)/0.07)] bg-[rgb(var(--surface-muted))] py-24 md:py-32 lg:py-40"
    >
      <Orb className="top-[-8%] left-1/2 -translate-x-1/2" size={700} opacity={0.18} />

      <div className="container-x">
        <SectionHeading
          eyebrow={`${MODULES.length}+ native modules`}
          title={
            <>
              Everything is a module.
              <br />
              <span className="text-gradient">Nothing is an integration.</span>
            </>
          }
          description="One data model underneath all of it. Turn on what you need today, switch on the rest whenever you're ready. No migration, no new vendor, no extra login."
        />

        {/* Controls */}
        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-col items-center gap-5">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules: payroll, hostel, timetable…"
                aria-label="Search modules"
                className="h-12 w-full rounded-2xl glass pr-4 pl-11 text-[14px] text-strong placeholder:text-subtle focus:border-brand-400/40"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {(['All', ...MODULE_CATEGORIES] as Filter[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilter(c)}
                  className={cn(
                    'relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-400',
                    filter === c ? 'text-white' : 'glass text-body hover:text-strong',
                  )}
                >
                  {filter === c && (
                    <motion.span
                      layoutId="module-pill"
                      transition={{ duration: 0.5, ease: EASE_PREMIUM }}
                      className="absolute inset-0 -z-10 rounded-full bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-azure-600))]"
                    />
                  )}
                  {c}
                  <span
                    className={cn(
                      'font-mono text-[10.5px]',
                      filter === c ? 'text-white/70' : 'text-subtle',
                    )}
                  >
                    {counts.get(c)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Grid */}
        <motion.ul
          layout
          className="mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        >
          <AnimatePresence mode="popLayout">
            {visible.map((m, i) => (
              <motion.li
                key={m.name}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(i * 0.012, 0.4),
                  ease: EASE_PREMIUM,
                }}
                className="group relative"
              >
                <div
                  className={cn(
                    'relative flex h-[132px] flex-col overflow-hidden rounded-2xl border bg-surface p-3.5 transition-all duration-500',
                    'hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-premium',
                    m.featured
                      ? 'border-brand-500/18'
                      : 'border-[rgb(var(--glass-border)/0.08)]',
                  )}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(120% 90% at 0% 0%, color-mix(in oklab, ${CATEGORY_TINT[m.category]} 16%, transparent), transparent 64%)`,
                    }}
                  />

                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                    style={{
                      background: `color-mix(in oklab, ${CATEGORY_TINT[m.category]} 14%, transparent)`,
                      color: CATEGORY_TINT[m.category],
                    }}
                  >
                    <m.icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                  </span>

                  {m.featured && (
                    <span
                      aria-hidden
                      className="absolute top-3.5 right-3.5 h-1.5 w-1.5 rounded-full"
                      style={{ background: CATEGORY_TINT[m.category] }}
                    />
                  )}

                  <h3 className="mt-3 text-[13px] leading-snug font-semibold text-balance text-strong">
                    {m.name}
                  </h3>

                  <span className="mt-auto font-mono text-[9px] tracking-[0.14em] text-subtle uppercase">
                    {m.category}
                  </span>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {matches.length === 0 && (
          <p className="mt-16 text-center text-[14.5px] text-subtle">
            No module matches “{query}”. Tell us what you need and we build it into the core.
          </p>
        )}

        {hidden > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="group inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-[13.5px] font-medium text-strong transition-colors duration-400 hover:border-brand-400/40"
            >
              Show all {matches.length} modules
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>
          </div>
        )}

        <Reveal delay={0.1}>
          <p className="mt-10 text-center text-[13.5px] text-subtle">
            Showing{' '}
            <span className="font-semibold text-strong">
              {visible.length} of {MODULES.length}
            </span>{' '}
            modules · new ones ship every sprint at no extra cost.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
