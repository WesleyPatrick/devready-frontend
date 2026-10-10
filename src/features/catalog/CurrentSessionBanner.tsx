import { useState } from 'react'
import { PlayCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { sessionPath, sessionResultPath } from '@/app/paths'
import { Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/features/challenge/ConfirmDialog'
import { useFinishSessionMutation, useGetCurrentSessionQuery } from '@/features/session/api'
import { sessionTexts } from '@/features/session/texts'
import { getProblem } from '@/lib/problem'
import { catalogTexts } from './texts'

const t = sessionTexts.banner

export function CurrentSessionBanner() {
  const { data: session, error } = useGetCurrentSessionQuery()
  const [finish, { isLoading, isError }] = useFinishSessionMutation()
  const [confirming, setConfirming] = useState(false)
  const navigate = useNavigate()
  if (!session || getProblem(error)?.status === 404) return null

  const unansweredQuestions = session.questions.filter((q) => q.chosenOptionId === null).length
  const untouchedChallenges = session.challenges.filter((c) => c.submissionsUsed === 0).length
  const subject =
    session.format === 'SIMULATION'
      ? `${session.area.name} · ${catalogTexts.levels[session.level]}`
      : (session.competency?.name ?? session.area.name)

  async function confirm() {
    if (!session || isLoading) return
    try {
      const { status } = await finish(session.id).unwrap()
      setConfirming(false)
      navigate(status === 'COMPLETED' ? sessionResultPath(session.id) : sessionPath(session.id))
    } catch {}
  }

  return (
    <Panel title={t.title(session.format)} icon={PlayCircle} iconClassName="text-brand">
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto text-sm text-muted-foreground">{subject}</p>
        <Button asChild size="sm">
          <Link to={sessionPath(session.id)}>{t.continue}</Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
          {t.finish}
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title={t.confirmTitle}
        body={t.confirmBody(unansweredQuestions, untouchedChallenges)}
        action={t.confirm}
        busy={isLoading}
        error={isError ? t.error : null}
        onConfirm={() => void confirm()}
        onCancel={() => setConfirming(false)}
      />
    </Panel>
  )
}
