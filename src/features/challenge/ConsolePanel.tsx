import type { ReactNode } from 'react'
import { Play, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CaseValues } from './CaseValues'
import { challengeTexts } from './texts'
import type { Challenge } from './types'

const t = challengeTexts.console

export type ConsoleTab = 'cases' | 'result'

export function ConsolePanel({
  challenge,
  tab,
  onTabChange,
  result,
}: {
  challenge: Pick<Challenge, 'visibleCases'>
  tab: ConsoleTab
  onTabChange: (tab: ConsoleTab) => void
  result: ReactNode
}) {
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as ConsoleTab)}
      className="flex min-h-0 flex-1 flex-col gap-0"
    >
      <TabsList variant="line" aria-label={t.tabs} className="mx-3 mt-2 shrink-0">
        <TabsTrigger value="cases">{t.cases}</TabsTrigger>
        <TabsTrigger value="result">{t.result}</TabsTrigger>
      </TabsList>
      <TabsContent
        forceMount
        value="cases"
        hidden={tab !== 'cases'}
        className="min-h-0 space-y-3 overflow-y-auto p-3"
      >
        {challenge.visibleCases.map((c) => (
          <div key={c.position} className="space-y-2 rounded-md bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {challengeTexts.result.caseLabel(c.position + 1)}
            </p>
            <CaseValues args={c.args} expected={c.expected} />
          </div>
        ))}
      </TabsContent>
      <TabsContent
        forceMount
        value="result"
        hidden={tab !== 'result'}
        className="min-h-0 overflow-y-auto p-3"
      >
        {result}
      </TabsContent>
    </Tabs>
  )
}

export function ActionBar({
  busy,
  onRun,
  onSubmit,
  note,
  submitBlocked = false,
}: {
  busy: boolean
  onRun: () => void
  onSubmit: () => void
  note?: ReactNode
  submitBlocked?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-3 py-2">
      <p className="hidden text-xs text-muted-foreground sm:block">{t.shortcut}</p>
      {note && <p className="shrink-0 text-xs font-medium whitespace-nowrap">{note}</p>}
      <div className="ml-auto flex shrink-0 gap-2">
        <Button
          variant="outline"
          aria-disabled={busy || undefined}
          className="aria-disabled:cursor-progress"
          onClick={onRun}
        >
          <Play aria-hidden />
          {t.run}
        </Button>
        <Button
          aria-disabled={busy || submitBlocked || undefined}
          className="aria-disabled:cursor-progress"
          onClick={onSubmit}
        >
          <Send aria-hidden />
          {t.submit}
        </Button>
      </div>
    </div>
  )
}
