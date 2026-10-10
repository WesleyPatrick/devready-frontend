import type { editor } from 'monaco-editor'

export const THEME_NAME = 'devready'

const HEX = /^#[0-9a-f]{6}$/i

const COLORS: Record<string, [token: string, alpha?: string]> = {
  'editor.background': ['--surface'],
  'editor.foreground': ['--foreground'],
  'editorLineNumber.foreground': ['--muted-foreground'],
  'editorLineNumber.activeForeground': ['--foreground'],
  'editor.lineHighlightBackground': ['--muted'],
  'editor.lineHighlightBorder': ['--muted'],
  'editorCursor.foreground': ['--brand'],
  'editor.selectionBackground': ['--brand', '55'],
  'editor.inactiveSelectionBackground': ['--brand', '33'],
  'editorIndentGuide.background1': ['--border'],
  'editorWidget.background': ['--popover'],
  'editorWidget.border': ['--border'],
  focusBorder: ['--ring'],
  'scrollbarSlider.background': ['--muted-foreground', '33'],
  'scrollbarSlider.hoverBackground': ['--muted-foreground', '55'],
  'scrollbarSlider.activeBackground': ['--muted-foreground', '77'],
}

export function buildTheme(
  read: (name: string) => string,
  dark: boolean,
): editor.IStandaloneThemeData {
  const colors: editor.IColors = {}
  for (const [key, [token, alpha = '']] of Object.entries(COLORS)) {
    const value = read(token).trim()
    if (HEX.test(value)) colors[key] = value + alpha
  }
  const muted = read('--muted-foreground').trim()
  const rules = HEX.test(muted) ? [{ token: 'comment', foreground: muted.slice(1) }] : []
  return { base: dark ? 'vs-dark' : 'vs', inherit: true, rules, colors }
}
