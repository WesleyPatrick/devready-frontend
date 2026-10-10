import { useState } from 'react'

export function useIncrease(value: number | undefined, { paused = false } = {}): number {
  const [seen, setSeen] = useState(value)
  const [pulse, setPulse] = useState(0)
  if (value !== undefined && value !== seen && (seen === undefined || !paused)) {
    setSeen(value)
    if (seen !== undefined && value > seen) setPulse(pulse + 1)
  }
  return pulse
}
