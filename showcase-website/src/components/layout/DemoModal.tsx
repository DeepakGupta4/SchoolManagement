import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react'
import { EASE_PREMIUM } from '@/lib/motion'
import { MagneticButton } from '@/components/ui/MagneticButton'

const SIZES = ['< 500 students', '500 – 1,500', '1,500 – 5,000', '5,000+ / multi-campus']

export function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false)
  const [size, setSize] = useState(1)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => setSubmitted(false), 400)
      return () => clearTimeout(id)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Book a live demo"
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.97, filter: 'blur(8px)' }}
            transition={{ duration: 0.55, ease: EASE_PREMIUM }}
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl glass-strong p-6 shadow-lift md:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-lg text-subtle transition-colors duration-300 hover:bg-[rgb(var(--glass-border)/0.08)] hover:text-strong"
            >
              <X className="h-4 w-4" />
            </button>

            {submitted ? (
              <div className="py-10 text-center">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: EASE_PREMIUM }}
                  className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/14 text-emerald-500"
                >
                  <CheckCircle2 className="h-8 w-8" />
                </motion.span>
                <h2 className="mt-6 font-display text-[24px] font-bold">Request received</h2>
                <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-subtle">
                  A specialist will reach out within one working day with a calendar link and a
                  tailored walkthrough for your campus.
                </p>
                <MagneticButton className="mt-7" variant="outline" onClick={onClose}>
                  Back to the site
                </MagneticButton>
              </div>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-600/12 px-3 py-1 font-mono text-[10.5px] font-semibold tracking-[0.14em] text-brand-500 uppercase">
                  <Sparkles className="h-3 w-3" />
                  Live demo
                </span>
                <h2 className="mt-4 font-display text-[26px] leading-tight font-bold">
                  See BuildSchoolOS on your own data
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-subtle">
                  Thirty minutes, no slides. We'll walk your actual workflows and hand you a
                  migration plan at the end.
                </p>

                <form
                  className="mt-7 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setSubmitted(true)
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Your name" placeholder="Rajesh Kumar" name="name" required />
                    <Field label="Role" placeholder="Principal / Director" name="role" required />
                  </div>
                  <Field
                    label="School name"
                    placeholder="Sunrise Public School"
                    name="school"
                    required
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Work email"
                      placeholder="you@school.edu.in"
                      name="email"
                      type="email"
                      required
                    />
                    <Field
                      label="Phone"
                      placeholder="+91 98765 43210"
                      name="phone"
                      type="tel"
                      required
                    />
                  </div>

                  <div>
                    <span className="mb-2 block font-mono text-[10.5px] tracking-[0.14em] text-subtle uppercase">
                      Campus size
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {SIZES.map((s, i) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSize(i)}
                          className={
                            'rounded-xl border px-3 py-2.5 text-[12.5px] font-medium transition-all duration-400 ' +
                            (size === i
                              ? 'border-brand-500/45 bg-brand-600/12 text-strong'
                              : 'border-[rgb(var(--glass-border)/0.1)] text-subtle hover:border-brand-500/25 hover:text-strong')
                          }
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <MagneticButton
                    size="lg"
                    className="w-full"
                    strength={0.14}
                    onClick={() => setSubmitted(true)}
                    icon={<ArrowRight className="h-4 w-4" />}
                  >
                    Request my demo
                  </MagneticButton>

                  <p className="text-center text-[11.5px] text-subtle">
                    We never share your details. Unsubscribe anytime.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.14em] text-subtle uppercase">
        {label}
      </span>
      <input
        {...props}
        className="h-11 w-full rounded-xl border border-[rgb(var(--glass-border)/0.1)] bg-[rgb(var(--surface-muted))] px-3.5 text-[14px] text-strong transition-colors duration-300 placeholder:text-subtle focus:border-brand-400/50"
      />
    </label>
  )
}
