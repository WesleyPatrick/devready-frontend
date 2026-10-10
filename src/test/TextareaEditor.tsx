import type { EditorProps } from '@/features/challenge/editorProps'

export default function TextareaEditor({
  value,
  language,
  modelPath,
  label,
  onChange,
  onRun,
}: EditorProps) {
  return (
    <textarea
      aria-label={label}
      data-language={language}
      data-model-path={modelPath}
      spellCheck={false}
      value={value}
      className="h-full w-full resize-none bg-surface p-3 font-mono text-sm"
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          onRun()
        }
      }}
    />
  )
}
