import { useEffect, useState } from 'react'

export type Pointer = { x: number; y: number }

/** Raw viewport pointer position, rAF-throttled. */
export function usePointer() {
  const [pointer, setPointer] = useState<Pointer>({ x: 0, y: 0 })

  useEffect(() => {
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        setPointer({ x: e.clientX, y: e.clientY })
        frame = 0
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return pointer
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** True on devices with a real hovering pointer — gate cursor/glow effects on this. */
export function useHasPointer() {
  return useMediaQuery('(hover: hover) and (pointer: fine)')
}
