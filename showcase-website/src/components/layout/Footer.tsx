import { Mail, MapPin } from 'lucide-react'
import { FOOTER_LINKS } from '@/data/site'
import { Logo } from './Navbar'
import { Reveal } from '@/components/ui/Reveal'
import { LiveDot } from '@/components/ui/Primitives'
import {
  GitHubIcon,
  LinkedInIcon,
  XIcon,
  YouTubeIcon,
} from '@/components/ui/SocialIcons'

const SOCIALS = [
  { icon: XIcon, label: 'X / Twitter', href: '#' },
  { icon: LinkedInIcon, label: 'LinkedIn', href: '#' },
  { icon: YouTubeIcon, label: 'YouTube', href: '#' },
  { icon: GitHubIcon, label: 'GitHub', href: '#' },
]

export function Footer() {
  return (
    <footer
      id="footer"
      className="relative scroll-mt-24 overflow-hidden border-t border-[rgb(var(--glass-border)/0.08)] bg-[rgb(var(--surface-muted))]"
    >
      {/* Oversized wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-6 flex justify-center overflow-hidden select-none md:-bottom-12"
      >
        <span className="font-display text-[19vw] leading-none font-extrabold tracking-tighter text-[rgb(var(--glass-border)/0.045)]">
          SchoolDeck
        </span>
      </div>

      <div className="relative container-x pt-20 pb-10 md:pt-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
          {/* Brand */}
          <Reveal>
            <div>
              <Logo />
              <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-subtle">
                Building India's most advanced school operating system. One intelligent platform
                for admissions, academics, finance, operations and AI.
              </p>

              <div className="mt-6 space-y-2.5">
                <a
                  href="mailto:schooldeck.in@gmail.com"
                  className="flex items-center gap-2.5 text-[13.5px] text-body transition-colors duration-300 hover:text-strong"
                >
                  <Mail className="h-3.5 w-3.5 text-brand-500" />
                  schooldeck.in@gmail.com
                </a>
                <p className="flex items-center gap-2.5 text-[13.5px] text-subtle">
                  <MapPin className="h-3.5 w-3.5 text-brand-500" />
                  Uttar Pradesh, India
                </p>
              </div>

              <div className="mt-7 flex gap-2">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="grid h-9 w-9 place-items-center rounded-xl glass text-subtle transition-all duration-400 hover:-translate-y-0.5 hover:border-brand-400/40 hover:text-strong"
                  >
                    <s.icon className="h-[15px] w-[15px]" />
                  </a>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_LINKS.map((col, i) => (
              <Reveal key={col.title} delay={0.06 * i}>
                <div>
                  <h3 className="font-mono text-[10.5px] font-semibold tracking-[0.18em] text-strong uppercase">
                    {col.title}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="group inline-flex items-center gap-1.5 text-[13.5px] text-subtle transition-colors duration-300 hover:text-strong"
                        >
                          <span className="h-px w-0 bg-brand-500 transition-all duration-400 group-hover:w-3" />
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[rgb(var(--glass-border)/0.08)] pt-7 md:flex-row">
          <p className="text-[12.5px] text-subtle">
            © {new Date().getFullYear()} SchoolDeck Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] text-subtle">
              <LiveDot />
              All systems operational
            </span>
            <span className="font-mono text-[11px] text-subtle">Made in India 🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
