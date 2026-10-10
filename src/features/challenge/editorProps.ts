import type { editor } from 'monaco-editor'
import type { ChallengeLanguage } from './types'

export type EditorProps = {
  value: string
  language: ChallengeLanguage
  modelPath: string
  label: string
  onChange: (value: string) => void
  onRun: () => void
}

export const MONACO_LANGUAGES: Record<ChallengeLanguage, string> = {
  JAVA: 'java',
  PYTHON: 'python',
  JAVASCRIPT: 'javascript',
}

export function editorOptions(label: string): editor.IStandaloneEditorConstructionOptions {
  return {
    ariaLabel: label,
    fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
    fontSize: 14,
    lineHeight: 22,
    padding: { top: 12, bottom: 12 },
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fixedOverflowWidgets: true,
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    wordBasedSuggestions: 'off',
    parameterHints: { enabled: false },
    hover: { enabled: false },
    codeLens: false,
    inlayHints: { enabled: 'off' },
    renderValidationDecorations: 'off',
    occurrencesHighlight: 'off',
    stickyScroll: { enabled: false },
  }
}
