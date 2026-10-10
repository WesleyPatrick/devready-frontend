import { QuestionText } from '@/components/QuestionText'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CaseValues } from './CaseValues'
import { SubmissionHistory } from './SubmissionHistory'
import { challengeTexts } from './texts'
import type { Challenge, SubmissionSummary } from './types'

const t = challengeTexts.statement

export function StatementPanel({
  challenge,
  onOpenSubmission,
}: {
  challenge: Challenge
  onOpenSubmission: (summary: SubmissionSummary) => void
}) {
  return (
    <Tabs
      defaultValue="statement"
      className="flex h-full min-h-0 flex-col gap-0 rounded-lg bg-surface"
    >
      <TabsList variant="line" aria-label={t.tabs} className="mx-3 mt-2 shrink-0">
        <TabsTrigger value="statement">{t.statement}</TabsTrigger>
        <TabsTrigger value="submissions">{t.submissions}</TabsTrigger>
      </TabsList>
      <TabsContent value="statement" className="min-h-0 space-y-5 overflow-y-auto p-4">
        <QuestionText text={challenge.statement} />
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">{t.examples}</h2>
          {challenge.visibleCases.map((c) => (
            <div key={c.position} className="space-y-2 rounded-md bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t.example(c.position + 1)}
              </p>
              <CaseValues args={c.args} expected={c.expected} />
            </div>
          ))}
          {challenge.hiddenCaseCount > 0 && (
            <p className="text-xs text-muted-foreground">{t.hidden(challenge.hiddenCaseCount)}</p>
          )}
        </section>
        <p className="text-xs text-muted-foreground">{t.limits(challenge.limits.timeLimitMs)}</p>
        {challenge.approachSummary && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">{t.approach}</h2>
            <QuestionText text={challenge.approachSummary} />
          </section>
        )}
      </TabsContent>
      <TabsContent value="submissions" className="min-h-0 overflow-y-auto p-4">
        <SubmissionHistory slug={challenge.slug} onOpen={onOpenSubmission} />
      </TabsContent>
    </Tabs>
  )
}
