import { buildTheme } from './monacoTheme'

const DARK: Record<string, string> = {
  '--surface': ' #262626',
  '--foreground': '#eceef2',
  '--muted': '#2f2f2f',
  '--muted-foreground': '#a3a3a3',
  '--border': '#333333',
  '--brand': '#f2994a',
  '--ring': '#f2994a',
  '--popover': '#262626',
}

const read = (values: Record<string, string>) => (name: string) => values[name] ?? ''

describe('buildTheme', () => {
  it('monta o tema escuro com as variáveis do site, sem espaço sobrando', () => {
    const theme = buildTheme(read(DARK), true)

    expect(theme.base).toBe('vs-dark')
    expect(theme.inherit).toBe(true)
    expect(theme.colors['editor.background']).toBe('#262626')
    expect(theme.colors['editorCursor.foreground']).toBe('#f2994a')
    expect(theme.colors['editor.selectionBackground']).toBe('#f2994a55')
    expect(theme.colors['editorLineNumber.foreground']).toBe('#a3a3a3')
  })

  it('pinta o comentário com a cor do texto apagado, sem o #', () => {
    expect(buildTheme(read(DARK), true).rules).toEqual([{ token: 'comment', foreground: 'a3a3a3' }])
  })

  it('sem a cor do texto apagado em hex, o comentário fica com o tema base', () => {
    expect(
      buildTheme(read({ ...DARK, '--muted-foreground': 'oklch(0.7 0 0)' }), true).rules,
    ).toEqual([])
  })

  it('no claro parte do tema claro do Monaco', () => {
    expect(buildTheme(read(DARK), false).base).toBe('vs')
  })

  it('variável fora do hex de seis dígitos fica de fora e vale a cor do tema base', () => {
    const theme = buildTheme(read({ ...DARK, '--brand': 'oklch(0.7 0.1 50)' }), true)

    expect(theme.colors).not.toHaveProperty('editorCursor.foreground')
    expect(theme.colors).not.toHaveProperty('editor.selectionBackground')
    expect(theme.colors['editor.background']).toBe('#262626')
  })
})
