import { appTexts } from '@/app/texts'

export function FrequencyBar({ jobs, total }: { jobs: number; total: number }) {
  const width = total > 0 ? Math.round((jobs / total) * 100) : 0
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1 w-14 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span className="block h-full bg-brand" style={{ width: `${width}%` }} />
      </span>
      <span className="font-mono text-xs tabular-nums text-muted-foreground" aria-hidden>
        {jobs}/{total}
      </span>
      <span className="sr-only">{appTexts.frequency(jobs, total)}</span>
    </span>
  )
}
