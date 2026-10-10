import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { sessionResultPath } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { catalogTexts } from '@/features/catalog/texts'
import { Countdown } from './Countdown'
import { sessionTexts } from './texts'
import type { Session } from './types'

const t = sessionTexts.header

export function SessionHeader({
  session,
  onFinish,
  onExpire,
  itemMenu,
}: {
  session: Session
  onFinish: () => void
  onExpire: () => void
  itemMenu?: ReactNode
}) {
  const title =
    session.format === 'SIMULATION'
      ? t.simulation(session.area.name, catalogTexts.levels[session.level])
      : t.lesson(session.competency?.name ?? session.area.name)
  const open = session.status === 'IN_PROGRESS'
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b bg-surface px-4 py-2">
      <h1 className="text-base font-semibold">{title}</h1>
      {open && session.deadlineAt && (
        <Countdown deadlineAt={session.deadlineAt} onExpire={onExpire} />
      )}
      {itemMenu}
      <div className="ml-auto">
        {open && (
          <Button size="sm" variant="outline" onClick={onFinish}>
            {t.finish}
          </Button>
        )}
        {session.status === 'COMPLETED' && (
          <Button asChild size="sm">
            <Link to={sessionResultPath(session.id)}>{t.result}</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
