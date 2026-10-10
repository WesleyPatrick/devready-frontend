import { useEffect, useState } from 'react'
import { prefersReducedMotion } from './reducedMotion'

export const COUNT_UP_MS = 700

export function useCountUp(
  value: number | undefined,
  { paused = false, duration = COUNT_UP_MS } = {},
): number | undefined {
  const [shown, setShown] = useState(value)
  const reduced = prefersReducedMotion()
  if (
    value !== undefined &&
    value !== shown &&
    (shown === undefined || value < shown || (!paused && reduced))
  ) {
    setShown(value)
  }
  const counting =
    value !== undefined && shown !== undefined && value > shown && !paused && !reduced

  useEffect(() => {
    if (!counting || value === undefined || shown === undefined) return
    const from = shown
    const start = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.max(0, Math.min(1, (now - start) / duration))
      const eased = 1 - (1 - progress) ** 3
      setShown(Math.round(from + (value - from) * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [counting, value, duration])

  return shown
}
