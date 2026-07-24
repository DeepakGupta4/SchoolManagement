import type { Variants, Transition } from 'framer-motion'

export const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const
export const EASE_SWIFT = [0.4, 0, 0.2, 1] as const

export const springSoft: Transition = { type: 'spring', stiffness: 120, damping: 20, mass: 0.6 }
export const springSnappy: Transition = { type: 'spring', stiffness: 320, damping: 30, mass: 0.5 }

/** Cinematic rise — the house reveal. Never a plain opacity fade. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 34, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE_PREMIUM },
  },
}

export const riseSmall: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: EASE_PREMIUM },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.85, ease: EASE_PREMIUM },
  },
}

export const stagger = (delayChildren = 0.05, staggerChildren = 0.07): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
})

export const VIEWPORT = { once: true, amount: 0.25 } as const
export const VIEWPORT_EARLY = { once: true, amount: 0.1 } as const
