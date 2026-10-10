import { challengeTexts } from './texts'

const t = challengeTexts.cases

function Value({ label, children }: { label: string; children: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="m-0">
        <pre className="overflow-x-auto font-mono text-xs break-all whitespace-pre-wrap">
          {children}
        </pre>
      </dd>
    </div>
  )
}

export function CaseValues({
  args,
  expected,
  actual,
  error,
}: {
  args: unknown[]
  expected: unknown
  actual?: unknown
  error?: string
}) {
  return (
    <dl className="m-0 space-y-2">
      <Value label={t.input}>{args.map((arg) => JSON.stringify(arg)).join('\n')}</Value>
      <Value label={t.expected}>{JSON.stringify(expected)}</Value>
      {actual !== undefined && <Value label={t.actual}>{JSON.stringify(actual)}</Value>}
      {error && <Value label={t.error}>{error}</Value>}
    </dl>
  )
}
