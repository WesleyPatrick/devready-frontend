import { Flame, Zap } from 'lucide-react'
import { StatChip } from '@/components/StatChip'
import { formatNumber } from '@/lib/format'
import { useCountUp } from '@/lib/motion/useCountUp'
import { useIncrease } from '@/lib/motion/useIncrease'
import { useOverlayOpen } from '@/lib/motion/overlays'
import { useGetProgressQuery } from './api'
import { progressTexts } from './texts'

const t = progressTexts.chips

export function ProgressChips() {
  const { data } = useGetProgressQuery()
  const paused = useOverlayOpen()
  const streakPulse = useIncrease(data?.streakDays, { paused })
  const xpPulse = useIncrease(data?.xp, { paused })
  const streakShown = useCountUp(data?.streakDays, { paused, duration: 300 })
  const xpShown = useCountUp(data?.xp, { paused })
  if (!data) return null
  const xp = formatNumber(data.xp)
  return (
    <span className="flex items-center gap-2.5">
      <StatChip
        icon={Flame}
        tone="brand"
        effect="blaze"
        pulse={streakPulse}
        value={String(streakShown ?? data.streakDays)}
        label={t.streak(data.streakDays)}
      />
      <StatChip
        icon={Zap}
        tone="medium"
        effect="zap"
        pulse={xpPulse}
        value={formatNumber(xpShown ?? data.xp)}
        label={t.xp(xp)}
      />
    </span>
  )
}
