import { useState } from 'react'
import type { Achievement } from './types'

export function useUnlocks(achievements: Achievement[] | undefined, { paused = false } = {}) {
  const [seen, setSeen] = useState<string[] | null>(null)
  const [fresh, setFresh] = useState<{ pulse: number; items: Achievement[] }>({
    pulse: 0,
    items: [],
  })
  if (achievements) {
    const unlocked = achievements.filter((item) => item.unlockedAt !== null)
    if (seen === null) {
      setSeen(unlocked.map((item) => item.slug))
    } else if (!paused) {
      const added = unlocked.filter((item) => !seen.includes(item.slug))
      if (added.length > 0) {
        setSeen([...seen, ...added.map((item) => item.slug)])
        setFresh({ pulse: fresh.pulse + 1, items: added })
      }
    }
  }
  return fresh
}
