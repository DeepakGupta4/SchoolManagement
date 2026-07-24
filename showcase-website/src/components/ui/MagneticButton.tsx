import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useHasPointer } from '@/hooks/useMouse'

type Variant = 'primary' | 'ghost' | 'outline' | 'soft'
type Size = 'sm' | 'md' | 'lg'

type Props = {
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
  href?: string
  onClick?: () => void
  strength?: number
  icon?: ReactNode
  'aria-label'?: string
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px] gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-[14px]',
  lg: 'h-[54px] px-7 text-[15px] gap-2.5 rounded-2xl',
}

const variants: Record<Variant, string> = {
  primary:
    'text-white bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-azure-600)_55%,var(--color-aqua-500))] bg-[length:200%_auto] shadow-glow hover:bg-[position:right_center]',
  outline:
    'text-strong glass hover:border-brand-400/40 hover:bg-[rgb(var(--glass-bg)/calc(var(--glass-alpha)*1.6))]',
  ghost: 'text-body hover:text-strong hover:bg-[rgb(var(--glass-bg)/var(--glass-alpha))]',
  soft: 'text-brand-600 dark:text-brand-300 bg-brand-600/10 hover:bg-brand-600/16 border border-brand-500/20',
}

/**
 * Button that leans toward the cursor. The label counter-translates at a
 * lower ratio so the surface feels like it has depth rather than sliding.
 */
export function MagneticButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  href,
  onClick,
  strength = 0.34,
  icon,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const hasPointer = useHasPointer()

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.4 })
  const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.4 })
  const labelX = useTransform(x, (v) => v * 0.45)
  const labelY = useTransform(y, (v) => v * 0.45)

  const handleMove = (e: React.PointerEvent) => {
    if (!hasPointer || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mx.set((e.clientX - (rect.left + rect.width / 2)) * strength)
    my.set((e.clientY - (rect.top + rect.height / 2)) * strength)
  }

  const reset = () => {
    mx.set(0)
    my.set(0)
  }

  const classes = cn(
    'group relative inline-flex select-none items-center justify-center overflow-hidden font-medium',
    'transition-[background-position,border-color,color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
    'will-change-transform',
    sizes[size],
    variants[variant],
    className,
  )

  const inner = (
    <>
      {/* sheen sweep */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_20%,rgb(255_255_255/0.28)_50%,transparent_80%)] transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-full" />
      <motion.span
        style={{ x: labelX, y: labelY }}
        className="relative z-10 inline-flex items-center gap-2 whitespace-nowrap"
      >
        {children}
        {icon}
      </motion.span>
    </>
  )

  const motionProps = {
    style: { x, y },
    onPointerMove: handleMove,
    onPointerLeave: reset,
    whileTap: { scale: 0.965 },
    ...rest,
  }

  if (href) {
    return (
      <motion.a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault()
            onClick()
          }
        }}
        className={classes}
        {...motionProps}
      >
        {inner}
      </motion.a>
    )
  }

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={classes}
      {...motionProps}
    >
      {inner}
    </motion.button>
  )
}
