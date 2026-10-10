import type { ReactNode } from 'react'

const FENCE = /```[a-z]*\n([\s\S]*?)```/g

function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, index) =>
        part.length > 2 && part.startsWith('`') && part.endsWith('`') ? (
          <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function QuestionText({ text, inline = false }: { text: string; inline?: boolean }) {
  if (inline) return <InlineCode text={text} />
  const blocks: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(FENCE)) {
    const before = text.slice(last, match.index).trim()
    if (before)
      blocks.push(
        <p key={`p${last}`} className="whitespace-pre-line">
          <InlineCode text={before} />
        </p>,
      )
    blocks.push(
      <pre
        key={`c${match.index}`}
        className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed"
      >
        <code>{match[1].trimEnd()}</code>
      </pre>,
    )
    last = match.index + match[0].length
  }
  const rest = text.slice(last).trim()
  if (rest)
    blocks.push(
      <p key={`p${last}`} className="whitespace-pre-line">
        <InlineCode text={rest} />
      </p>,
    )
  return <div className="space-y-3 text-sm leading-relaxed">{blocks}</div>
}
