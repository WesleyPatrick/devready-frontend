import { createElement, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { achievementIcon } from '@/features/track/achievementIcons'
import { burstFrom } from '@/lib/motion/celebrate'
import { useOverlayOpen } from '@/lib/motion/overlays'
import { prefersReducedMotion } from '@/lib/motion/reducedMotion'
import { useGetAchievementsQuery } from './api'
import { progressTexts } from './texts'
import type { Achievement } from './types'
import { useUnlocks } from './useUnlocks'

function AchievementToast({ achievement }: { achievement: Achievement }) {
  const box = useRef<HTMLDivElement>(null)
  const burst = useRef(false)
  useEffect(() => {
    if (burst.current) return
    burst.current = true
    void burstFrom(box.current, 70)
  }, [])
  return (
    <div
      ref={box}
      className="relative flex w-80 max-w-full items-center gap-3 overflow-hidden rounded-lg bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-medium/15 text-medium [perspective:400px]">
        {createElement(achievementIcon(achievement.icon), {
          className: 'size-5 animate-flip motion-reduce:animate-none',
          'aria-hidden': true,
        })}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{progressTexts.toast.unlocked}</p>
        <p className="text-sm text-muted-foreground">{achievement.name}</p>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-shine bg-linear-to-r from-transparent via-foreground/10 to-transparent motion-reduce:hidden"
      />
    </div>
  )
}

const TOAST_DELAY_MS = 600

export function AchievementToasts() {
  const { data } = useGetAchievementsQuery()
  const paused = useOverlayOpen()
  const fresh = useUnlocks(data, { paused })
  useEffect(() => {
    const timer = setTimeout(
      () => {
        for (const achievement of fresh.items) {
          toast.custom(() => <AchievementToast achievement={achievement} />, {
            id: `achievement-${achievement.slug}`,
            duration: 6000,
          })
        }
      },
      prefersReducedMotion() ? 0 : TOAST_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [fresh])
  return null
}
