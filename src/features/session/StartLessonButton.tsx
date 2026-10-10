import { BookOpenCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { sessionPath } from '@/app/paths'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getProblem } from '@/lib/problem'
import { useStartLessonMutation } from './api'
import { openSessionIdOf } from './errors'
import { sessionTexts } from './texts'
import { LESSON_MIN } from './types'

const t = sessionTexts.lesson

export function StartLessonButton({
  competency,
  questionCount,
}: {
  competency: string
  questionCount: number
}) {
  const navigate = useNavigate()
  const [startLesson, { isLoading, error, reset }] = useStartLessonMutation()
  if (questionCount < LESSON_MIN) return null
  const openId = openSessionIdOf(error)

  async function start() {
    if (isLoading) return
    reset()
    try {
      const lesson = await startLesson({ competency }).unwrap()
      navigate(sessionPath(lesson.id))
    } catch {}
  }

  return (
    <div className="space-y-2 rounded-md bg-muted p-3">
      <p className="text-sm text-muted-foreground">{t.hint(questionCount)}</p>
      <Button
        size="sm"
        aria-disabled={isLoading || undefined}
        className="aria-disabled:cursor-progress"
        onClick={() => void start()}
      >
        <BookOpenCheck aria-hidden />
        {isLoading ? t.starting : t.start}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {getProblem(error)?.detail ?? t.error}
            {openId && (
              <Link
                className="font-medium text-brand underline-offset-4 hover:underline"
                to={sessionPath(openId)}
              >
                {t.continue}
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
