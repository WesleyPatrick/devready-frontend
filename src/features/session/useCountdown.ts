import { useEffect, useRef, useState } from 'react'

export const COUNTDOWN_TICK_MS = 1000

let tickOverride: number | undefined

export function setCountdownTickForTests(ms: number | undefined) {
  tickOverride = ms
}

export function useCountdown(deadlineAt: string | null, onExpire: () => void): number | null {
  const deadline = deadlineAt === null ? null : new Date(deadlineAt).getTime()
  const [now, setNow] = useState(() => Date.now())
  const fired = useRef(false)

  useEffect(() => {
    if (deadline === null) return
    const timer = setInterval(() => setNow(Date.now()), tickOverride ?? COUNTDOWN_TICK_MS)
    return () => clearInterval(timer)
  }, [deadline])

  const remaining = deadline === null ? null : Math.max(0, deadline - now)

  useEffect(() => {
    if (remaining === 0 && !fired.current) {
      fired.current = true
      onExpire()
    }
  }, [remaining, onExpire])

  return remaining
}

const pad = (n: number) => String(n).padStart(2, '0')

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}
