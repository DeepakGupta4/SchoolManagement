import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Menu, Moon, Sun, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'
import { NAV_ITEMS } from '@/data/site'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { useTheme } from '@/hooks/useTheme'
import { scrollToId } from '@/hooks/useLenis'

// Existing schools sign in to the admin app. Defaults to the deployed admin
// URL; override with VITE_ADMIN_URL if it changes (e.g. a custom domain).
const ADMIN_URL = (import.meta.env.VITE_ADMIN_URL ?? 'https://school-management-omega-lemon.vercel.app').replace(/\/$/, '')
export const LOGIN_HREF = `${ADMIN_URL}/login`

export function Logo({ className }: { className?: string }) {
  return (
    <a
      href="#top"
      onClick={(e) => {
        e.preventDefault()
        scrollToId('top')
      }}
      className={cn('group flex shrink-0 items-center gap-2.5', className)}
      aria-label="SchoolDeck home"
    >
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-white shadow-glow ring-1 ring-black/5">
        <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgb(255_255_255/0.6),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
        <img src="/logo-icon.png" alt="SchoolDeck" className="relative h-full w-full object-contain" />
      </span>
      {/* Two-tone wordmark matching the logo: "School" neutral, "Deck" blue.
          "School" uses text-strong (not a fixed navy) so it stays legible in
          dark mode; "Deck" keeps the logo's blue in both themes. */}
      <span className="font-display text-[15px] leading-none font-extrabold tracking-tight">
        <span className="text-strong">School</span>
        <span className="text-[#2563eb]">Deck</span>
      </span>
    </a>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="relative grid h-9 w-9 place-items-center rounded-xl glass text-subtle transition-colors duration-300 hover:text-strong"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.35, ease: EASE_PREMIUM }}
          className="grid place-items-center"
        >
          {theme === 'dark' ? (
            <Sun className="h-[15px] w-[15px]" />
          ) : (
            <Moon className="h-[15px] w-[15px]" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export function Navbar({ onBookDemo }: { onBookDemo: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const go = (href: string) => {
    setMobileOpen(false)
    setOpenMenu(null)
    scrollToId(href.replace('#', ''))
  }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.15, ease: EASE_PREMIUM }}
        className="fixed inset-x-0 top-0 z-50"
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div
          className={cn(
            'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
            scrolled
              ? 'border-b border-[rgb(var(--glass-border)/0.08)] bg-[rgb(var(--surface)/0.72)] backdrop-blur-2xl backdrop-saturate-150'
              : 'border-b border-transparent bg-transparent',
          )}
        >
          <nav
            className="container-x flex h-[68px] items-center justify-between gap-4"
            aria-label="Primary"
          >
            <Logo />

            {/* Desktop nav */}
            <ul className="hidden items-center gap-0.5 lg:flex">
              {NAV_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(item.children ? item.label : null)}
                >
                  <button
                    type="button"
                    onClick={() => go(item.href)}
                    className={cn(
                      'flex items-center gap-1 rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-300',
                      openMenu === item.label ? 'text-strong' : 'text-body hover:text-strong',
                    )}
                  >
                    {item.label}
                    {item.children && (
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 transition-transform duration-300',
                          openMenu === item.label && 'rotate-180',
                        )}
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {item.children && openMenu === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
                        transition={{ duration: 0.32, ease: EASE_PREMIUM }}
                        className="absolute top-[calc(100%+10px)] left-1/2 w-[420px] -translate-x-1/2 rounded-2xl glass-strong p-2 shadow-lift"
                      >
                        <div className="grid grid-cols-2 gap-1">
                          {item.children.map((child) => (
                            <button
                              key={child.label}
                              type="button"
                              onClick={() => go(child.href)}
                              className="group flex items-start gap-3 rounded-xl p-3 text-left transition-colors duration-300 hover:bg-[rgb(var(--glass-border)/0.06)]"
                            >
                              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600/12 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600/20 dark:text-brand-300">
                                <child.icon className="h-4 w-4" strokeWidth={2} />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[13px] font-semibold text-strong">
                                  {child.label}
                                </span>
                                <span className="block text-[11.5px] leading-snug text-subtle">
                                  {child.description}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a
                href={LOGIN_HREF}
                className="hidden items-center rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-body transition-colors duration-300 hover:text-strong sm:inline-flex"
              >
                Log in
              </a>
              <MagneticButton
                size="sm"
                variant="primary"
                className="hidden sm:inline-flex"
                onClick={onBookDemo}
              >
                Start free trial
              </MagneticButton>
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
                className="grid h-9 w-9 place-items-center rounded-xl glass text-strong lg:hidden"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[rgb(var(--surface)/0.94)] backdrop-blur-2xl lg:hidden"
          >
            <div className="container-x flex h-full flex-col gap-1 overflow-y-auto pt-24 pb-10">
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + i * 0.05, duration: 0.5, ease: EASE_PREMIUM }}
                >
                  <button
                    type="button"
                    onClick={() => go(item.href)}
                    className="w-full border-b border-[rgb(var(--glass-border)/0.07)] py-4 text-left font-display text-2xl font-semibold text-strong"
                  >
                    {item.label}
                  </button>
                </motion.div>
              ))}
              <a
                href={LOGIN_HREF}
                className="mt-8 flex w-full items-center justify-center rounded-xl border border-[rgb(var(--glass-border)/0.14)] py-3.5 text-[15px] font-semibold text-body"
              >
                Log in
              </a>
              <MagneticButton
                size="lg"
                className="mt-3 w-full"
                onClick={() => {
                  setMobileOpen(false)
                  onBookDemo()
                }}
              >
                Start free trial
              </MagneticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
