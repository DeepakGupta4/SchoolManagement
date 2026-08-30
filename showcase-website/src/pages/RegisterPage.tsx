import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Loader2, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { EASE_PREMIUM } from '@/lib/motion'
import { submitSchoolRegistration, type SchoolRegistration } from '@/lib/api'

const SCHOOL_TYPES = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Pre-School', 'Other']

const EMPTY: SchoolRegistration = {
  schoolName: '',
  ownerName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  studentCount: 0,
  teacherCount: 0,
  schoolType: 'CBSE',
  website: '',
  message: '',
}

const TRIAL_POINTS = [
  { icon: Clock, title: '7 days, completely free', body: 'Full access to every module. No credit card, no commitment.' },
  { icon: ShieldCheck, title: 'Your own secure workspace', body: 'A private, isolated account for your school with your real data.' },
  { icon: Lock, title: 'Nothing is deleted', body: 'After the trial your data stays safe — activate a plan whenever you are ready.' },
]

export function RegisterPage() {
  const [form, setForm] = useState<SchoolRegistration>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set = <K extends keyof SchoolRegistration>(key: K, value: SchoolRegistration[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await submitSchoolRegistration({
        ...form,
        studentCount: Number(form.studentCount) || 0,
        teacherCount: Number(form.teacherCount) || 0,
      })
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--surface))]">
      {/* Top bar */}
      <header className="border-b border-[rgb(var(--glass-border)/0.08)]">
        <div className="container-x flex h-[68px] items-center justify-between">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="SchoolDeck home">
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-white shadow-glow ring-1 ring-black/5">
              <img src="/logo-icon.png" alt="SchoolDeck" className="relative h-full w-full object-contain" />
            </span>
            <span className="font-display text-[15px] leading-none font-extrabold tracking-tight">
              <span className="text-strong">School</span>
              <span className="text-[#2563eb]">Deck</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-body transition-colors hover:text-strong"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>
      </header>

      <main className="container-x py-12 md:py-16">
        {done ? (
          <SuccessCard email={form.email} />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
            {/* Value column */}
            <div className="lg:sticky lg:top-16 lg:self-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-600/12 px-3 py-1 font-mono text-[10.5px] font-semibold tracking-[0.14em] text-brand-500 uppercase">
                <Sparkles className="h-3 w-3" />
                7-day free trial
              </span>
              <h1 className="mt-4 font-display text-[clamp(1.9rem,3.4vw,2.75rem)] leading-[1.08] font-extrabold tracking-[-0.03em]">
                Start your school on{' '}
                <span className="text-gradient">SchoolDeck</span>
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-subtle">
                Tell us about your school and request a free demo. Once our team approves your
                request, we'll email your login credentials and your 7-day trial begins.
              </p>

              <ul className="mt-8 space-y-5">
                {TRIAL_POINTS.map((p) => (
                  <li key={p.title} className="flex gap-3.5">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600/12 text-brand-500">
                      <p.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[14.5px] font-semibold text-strong">{p.title}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-subtle">{p.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Form column */}
            <motion.div
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: EASE_PREMIUM }}
              className="rounded-3xl glass-strong p-6 shadow-lift md:p-8"
            >
              <h2 className="font-display text-[22px] font-bold">School registration</h2>
              <p className="mt-1.5 text-[13.5px] text-subtle">
                Fields marked with <span className="text-brand-500">*</span> are required.
              </p>

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <Field label="School name" required value={form.schoolName} onChange={(v) => set('schoolName', v)} placeholder="Sunrise Public School" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Owner / Principal" required value={form.ownerName} onChange={(v) => set('ownerName', v)} placeholder="Rajesh Kumar" />
                  <Field label="Email" type="email" required value={form.email} onChange={(v) => set('email', v)} placeholder="you@school.edu.in" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone" type="tel" required value={form.phone} onChange={(v) => set('phone', v)} placeholder="+91 98765 43210" />
                  <SelectField label="School type" value={form.schoolType} onChange={(v) => set('schoolType', v)} options={SCHOOL_TYPES} />
                </div>

                <Field label="Address" required value={form.address} onChange={(v) => set('address', v)} placeholder="12 MG Road" />

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="City" required value={form.city} onChange={(v) => set('city', v)} placeholder="Lucknow" />
                  <Field label="State" required value={form.state} onChange={(v) => set('state', v)} placeholder="Uttar Pradesh" />
                  <Field label="Country" required value={form.country} onChange={(v) => set('country', v)} placeholder="India" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Number of students" type="number" value={String(form.studentCount || '')} onChange={(v) => set('studentCount', Number(v) || 0)} placeholder="850" />
                  <Field label="Number of teachers" type="number" value={String(form.teacherCount || '')} onChange={(v) => set('teacherCount', Number(v) || 0)} placeholder="45" />
                </div>

                <Field label="Website (optional)" type="url" value={form.website} onChange={(v) => set('website', v)} placeholder="https://yourschool.edu.in" />

                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.14em] text-subtle uppercase">
                    Message / requirements (optional)
                  </span>
                  <textarea
                    value={form.message}
                    onChange={(e) => set('message', e.target.value)}
                    rows={3}
                    placeholder="Anything specific you'd like to see?"
                    className="w-full rounded-xl border border-[rgb(var(--glass-border)/0.1)] bg-[rgb(var(--surface-muted))] px-3.5 py-3 text-[14px] text-strong transition-colors duration-300 placeholder:text-subtle focus:border-brand-400/50 focus:outline-none"
                  />
                </label>

                {error && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-500">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[14.5px] font-semibold text-white shadow-glow transition-all duration-300 hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      Request 7-day free demo
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11.5px] text-subtle">
                  We never share your details. By submitting you agree to be contacted about your demo.
                </p>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}

function SuccessCard({ email }: { email: string }) {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_PREMIUM }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/14 text-emerald-500"
      >
        <CheckCircle2 className="h-8 w-8" />
      </motion.span>
      <h1 className="mt-6 font-display text-[28px] font-bold">Request submitted successfully</h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-subtle">
        Our administrator will review your request. Once approved, your login credentials will be
        sent to <span className="font-semibold text-strong">{email}</span> and your 7-day free trial
        will begin.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-[rgb(var(--glass-border)/0.14)] px-5 text-[14px] font-semibold text-body transition-colors hover:text-strong"
        >
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.14em] text-subtle uppercase">
        {label}
        {required && <span className="text-brand-500"> *</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        type={type}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-[rgb(var(--glass-border)/0.1)] bg-[rgb(var(--surface-muted))] px-3.5 text-[14px] text-strong transition-colors duration-300 placeholder:text-subtle focus:border-brand-400/50 focus:outline-none"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.14em] text-subtle uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-[rgb(var(--glass-border)/0.1)] bg-[rgb(var(--surface-muted))] px-3.5 text-[14px] text-strong transition-colors duration-300 focus:border-brand-400/50 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}
