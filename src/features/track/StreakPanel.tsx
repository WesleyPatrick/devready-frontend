import { useEffect, useRef } from 'react'
import { CalendarDays, Flame, Target } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { useGetProgressQuery } from '@/features/progress/api'
import { isoDate } from '@/lib/format'
import { burstFrom } from '@/lib/motion/celebrate'
import { useOverlayOpen } from '@/lib/motion/overlays'
import { useCountUp } from '@/lib/motion/useCountUp'
import { useIncrease } from '@/lib/motion/useIncrease'
import { cn } from '@/lib/utils'
import { trackTexts } from './texts'
import { PanelSkeleton } from '@/components/Skeleton'

const t = trackTexts.streak
const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' })
const longDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })

export function StreakPanel() {
  const { data, isError } = useGetProgressQuery()
  const paused = useOverlayOpen()
  const streakPulse = useIncrease(data?.streakDays, { paused })
  const reached = data ? Number(data.dailyGoal.done >= data.dailyGoal.target) : undefined
  const goalPulse = useIncrease(reached, { paused })
  const shownDone = useCountUp(data?.dailyGoal.done, { paused, duration: 300 })
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (goalPulse > 0) void burstFrom(bar.current)
  }, [goalPulse])
  if (isError && !data) return null
  if (!data) {
    return <PanelSkeleton label={t.loading} lines={5} />
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const todayKey = isoDate(now)
  const counts = new Map(data.activity.map((day) => [day.date, day.count]))
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks = (new Date(year, month, 1).getDay() + 6) % 7
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1)
    const key = isoDate(date)
    return { date, key, count: counts.get(key) ?? 0 }
  })
  const active = days.filter((day) => day.count > 0).length
  const name = monthName.format(now)
  const { done, target } = data.dailyGoal
  const visibleDone = shownDone ?? done

  return (
    <Panel
      title={t.title(data.streakDays)}
      icon={Flame}
      iconClassName="text-brand"
      actions={
        <>
          <CalendarDays className="size-3.5" aria-hidden />
          <span className="capitalize">{name}</span>
        </>
      }
    >
      <div aria-hidden className="grid grid-cols-7 gap-1 text-center">
        {t.weekdays.map((weekday, index) => (
          <span key={index} className="font-mono text-[10px] text-muted-foreground">
            {weekday}
          </span>
        ))}
      </div>
      <div aria-hidden className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: blanks }, (_, index) => (
          <span key={`blank${index}`} />
        ))}
        {days.map(({ date, key, count }) => (
          <span
            key={key === todayKey ? `${key}-${streakPulse}` : key}
            title={t.day(longDate.format(date), count)}
            data-today={key === todayKey ? 'true' : undefined}
            className={cn(
              'aspect-square rounded',
              count > 0 ? 'bg-easy' : 'bg-muted',
              key > todayKey && 'opacity-40',
              key === todayKey && 'outline-2 outline-offset-2 outline-foreground',
              key === todayKey && streakPulse > 0 && 'animate-pop motion-reduce:animate-none',
            )}
          />
        ))}
      </div>
      <p className="sr-only">{t.summary(active, name)}</p>
      <div
        data-slot="goal"
        key={`goal-${goalPulse}`}
        className={cn(
          'mt-4 border-t border-border pt-3',
          goalPulse > 0 && 'animate-glow-easy rounded-md motion-reduce:animate-none',
        )}
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="relative inline-grid">
            <Target className="size-4 shrink-0 text-easy" aria-hidden />
            {goalPulse > 0 && (
              <span
                aria-hidden
                className="absolute inset-0 animate-ring-out rounded-full border-2 border-easy motion-reduce:hidden"
              />
            )}
          </span>
          <span className="font-medium">{t.goal}</span>
          <span aria-hidden className="ml-auto font-mono text-xs text-muted-foreground">
            {visibleDone}/{target}
          </span>
          <span className="sr-only">{t.goalValue(done, target)}</span>
        </div>
        <div ref={bar} data-slot="goal-bar" className="mt-2 h-1.5 rounded-full bg-muted">
          <div
            className="relative h-full overflow-hidden rounded-full bg-easy transition-[width] duration-700 ease-[cubic-bezier(.3,1.3,.5,1)] motion-reduce:transition-none"
            style={{ width: `${target > 0 ? Math.min(100, (visibleDone / target) * 100) : 0}%` }}
          >
            {goalPulse > 0 && (
              <span
                key={goalPulse}
                aria-hidden
                className="absolute inset-0 animate-shine bg-linear-to-r from-transparent via-white/50 to-transparent motion-reduce:hidden"
              />
            )}
          </div>
        </div>
      </div>
    </Panel>
  )
}
