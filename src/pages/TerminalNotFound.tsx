import { useEffect, useState } from 'react'
import { appTexts } from '@/app/texts'
import { prefersReducedMotion } from '@/lib/motion/reducedMotion'

const t = appTexts.notFound.terminal
const MAX_PATH = 40
const TYPE_MS = 40

function shorten(path: string) {
  return path.length > MAX_PATH ? `${path.slice(0, MAX_PATH - 1)}…` : path
}

export function TerminalNotFound({ path }: { path: string }) {
  const lines = [`GET ${shorten(path)}`, t.status, t.comment]
  const total = lines.reduce((sum, line) => sum + line.length, 0)
  const [typed, setTyped] = useState(() => (prefersReducedMotion() ? total : 0))
  useEffect(() => {
    if (typed >= total) return
    const timer = setTimeout(() => setTyped(typed + 1), TYPE_MS)
    return () => clearTimeout(timer)
  }, [typed, total])

  let left = typed
  const visible = lines.map((line) => {
    const part = line.slice(0, Math.max(0, left))
    left -= line.length
    return part
  })
  const styles = ['text-foreground', 'font-semibold text-hard', 'text-muted-foreground']

  return (
    <div data-slot="terminal" aria-hidden className="space-y-6">
      <p className="text-center font-mono text-6xl font-bold tracking-tight">
        <span className="inline-block animate-glitch motion-reduce:animate-none">
          4<span className="text-brand">0</span>4
        </span>
      </p>
      <div className="overflow-hidden rounded-lg bg-background text-left font-mono text-sm">
        <div className="flex gap-1.5 bg-muted px-3 py-2">
          <i className="size-2.5 rounded-full bg-background" />
          <i className="size-2.5 rounded-full bg-background" />
          <i className="size-2.5 rounded-full bg-background" />
        </div>
        <div className="min-h-28 space-y-1 p-4 leading-relaxed">
          {visible.map((part, index) =>
            part ? (
              <p key={index} className={styles[index]}>
                {index === 0 && <span className="text-muted-foreground">$ </span>}
                {part}
              </p>
            ) : null,
          )}
          <span className="inline-block h-4 w-2 animate-blink bg-brand align-middle motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  )
}
