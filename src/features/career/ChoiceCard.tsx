import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  type: 'checkbox' | 'radio'
  name?: string
  value: string
  title: string
  description?: string
  checked: boolean
  disabled?: boolean
  leading?: ReactNode
  onChange: () => void
}

export function ChoiceCard({
  type,
  name,
  value,
  title,
  description,
  checked,
  disabled = false,
  leading,
  onChange,
}: Props) {
  const titleId = useId()
  const descriptionId = useId()
  return (
    <label
      className={cn(
        'flex gap-3 rounded-lg border border-transparent bg-surface p-4 transition-colors',
        description ? 'items-start' : 'items-center',
        'has-checked:border-primary has-checked:bg-primary/10',
        'has-focus-visible:ring-2 has-focus-visible:ring-ring',
        'has-disabled:cursor-not-allowed has-disabled:border-dashed has-disabled:border-input has-disabled:bg-transparent has-disabled:text-muted-foreground',
        !disabled && 'cursor-pointer hover:bg-accent',
      )}
    >
      <input
        type={type}
        name={name}
        value={value}
        className={cn('size-4 shrink-0 accent-primary', description && 'mt-0.5')}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      />
      {leading}
      <span className="min-w-0">
        <span id={titleId} className="block font-medium">
          {title}
        </span>
        {description && (
          <span id={descriptionId} className="mt-1 block text-sm text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </label>
  )
}
