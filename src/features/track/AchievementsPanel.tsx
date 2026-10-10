import { Lock, Trophy } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { useGetAchievementsQuery } from '@/features/progress/api'
import { useUnlocks } from '@/features/progress/useUnlocks'
import { useOverlayOpen } from '@/lib/motion/overlays'
import { cn } from '@/lib/utils'
import { achievementIcon } from './achievementIcons'
import { trackTexts } from './texts'
import { Loading, Skeleton } from '@/components/Skeleton'

const t = trackTexts.achievements

export function AchievementsPanel() {
  const { data, isError } = useGetAchievementsQuery()
  const paused = useOverlayOpen()
  const fresh = useUnlocks(data, { paused })
  if (isError && !data) return null
  if (!data) {
    return (
      <Loading label={t.loading} className="space-y-3 rounded-lg bg-surface p-4">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </Loading>
    )
  }
  const unlocked = data.filter((item) => item.unlockedAt !== null).length

  return (
    <Panel
      title={t.title}
      icon={Trophy}
      iconClassName="text-medium"
      actions={
        <>
          <span className="font-mono">{t.count(unlocked, data.length)}</span>
        </>
      }
    >
      <ul className="grid grid-cols-4 gap-2">
        {data.map((item) => {
          const isUnlocked = item.unlockedAt !== null
          const Icon = isUnlocked ? achievementIcon(item.icon) : Lock
          const isFresh = fresh.items.some((entry) => entry.slug === item.slug)
          return (
            <li
              key={item.slug}
              title={`${item.name}: ${item.description}`}
              className={cn(
                'flex aspect-square [perspective:400px] items-center justify-center rounded-lg border',
                isUnlocked
                  ? 'border-brand/40 bg-brand/10 text-brand'
                  : 'border-border bg-background text-muted-foreground',
              )}
            >
              <span
                key={isFresh ? `${item.slug}-${fresh.pulse}` : item.slug}
                className={cn(isFresh && 'animate-unlock motion-reduce:animate-none')}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="sr-only">{t.item(item.name, isUnlocked, item.description)}</span>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
