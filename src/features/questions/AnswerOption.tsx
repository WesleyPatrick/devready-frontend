import { useId } from 'react'
import { CircleCheck, CircleX } from 'lucide-react'
import { QuestionText } from '@/components/QuestionText'
import { cn } from '@/lib/utils'
import { questionsTexts } from './texts'

const t = questionsTexts.dialog

export function AnswerOption({
  name,
  id,
  text,
  checked,
  disabled,
  answered,
  state,
  late,
  onChange,
}: {
  name: string
  id: string
  text: string
  checked: boolean
  disabled: boolean
  answered: boolean
  state: 'correct' | 'wrong' | null
  late: boolean
  onChange: () => void
}) {
  const textId = useId()
  return (
    <label
      className={cn(
        'flex items-start gap-3 rounded-md border border-input px-3 py-2.5 text-sm',
        !answered && 'has-checked:border-primary',
        state === 'correct' && 'border-easy bg-easy/10',
        state === 'wrong' && 'animate-shake border-hard bg-hard/10 motion-reduce:animate-none',
        late &&
          'transition-colors delay-[450ms] duration-200 motion-reduce:transition-none motion-reduce:delay-0',
      )}
    >
      <input
        type="radio"
        name={name}
        value={id}
        className="mt-0.5 size-4 shrink-0 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-labelledby={textId}
      />
      <span id={textId} className="min-w-0 flex-1">
        <QuestionText inline text={text} />
      </span>
      {state === 'correct' && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground">
          <CircleCheck className="size-4 text-easy" aria-hidden />
          {t.correctOption}
        </span>
      )}
      {state === 'wrong' && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground">
          <CircleX className="size-4 text-hard" aria-hidden />
          {t.yourAnswer}
        </span>
      )}
    </label>
  )
}
