import { VerdictIcon } from '@/features/challenge/SubmissionResult'
import type { Submission } from '@/features/challenge/types'
import { sessionTexts } from './texts'

const t = sessionTexts.challenge

export function SealedResult({ submission }: { submission: Submission }) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-2 font-semibold">
        <VerdictIcon status={submission.status} />
        {t.sealed(submission.passedCount, submission.totalCount)}
      </p>
      <p className="text-sm text-muted-foreground">{t.sealedHint}</p>
    </div>
  )
}
