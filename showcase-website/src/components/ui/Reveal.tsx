import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM, VIEWPORT_EARLY } from '@/lib/motion'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  y?: number
  blur?: number
  once?: boolean
}

/** Cinematic reveal: rise + de-blur. Used everywhere instead of a bare fade. */
export function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.9,
  y = 34,
  blur = 10,
  once = true,
}: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: `blur(${blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ ...VIEWPORT_EARLY, once }}
      transition={{ duration, delay, ease: EASE_PREMIUM }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Word-by-word headline reveal. Splits on spaces and keeps each word in an
 * overflow-clipped mask so the letters slide up from behind a line.
 */
export function RevealText({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.045,
}: {
  text: string
  className?: string
  wordClassName?: string
  delay?: number
  stagger?: number
}) {
  const words = text.split(' ')

  return (
    <motion.span
      className={cn('inline', className)}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT_EARLY}
      transition={{ delayChildren: delay, staggerChildren: stagger }}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden pb-[0.12em] align-bottom"
        >
          <motion.span
            className={cn('inline-block', wordClassName)}
            variants={{
              hidden: { y: '110%', opacity: 0, rotate: 3 },
              show: {
                y: '0%',
                opacity: 1,
                rotate: 0,
                transition: { duration: 1, ease: EASE_PREMIUM },
              },
            }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </motion.span>
  )
}
