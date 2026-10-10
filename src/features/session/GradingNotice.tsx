import { LoaderCircle } from 'lucide-react'
import { sessionTexts } from './texts'

const t = sessionTexts.grading

export function GradingNotice() {
  return (
    <div
      role="status"
      className="mx-auto flex max-w-md flex-col items-center gap-2 p-10 text-center"
    >
      <LoaderCircle
        className="size-6 animate-spin text-muted-foreground motion-reduce:animate-none"
        aria-hidden
      />
      <p className="font-semibold">{t.title}</p>
      <p className="text-sm text-muted-foreground">{t.body}</p>
    </div>
  )
}
