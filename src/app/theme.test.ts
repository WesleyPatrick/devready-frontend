import {
  applyTheme,
  getPreference,
  readPreference,
  resetThemeForTests,
  resolveTheme,
  savePreference,
  setPreference,
  subscribeTheme,
  THEME_STORAGE_KEY,
} from './theme'

function fakeMatchMedia() {
  const state = { matches: false, listener: undefined as (() => void) | undefined }
  window.matchMedia = ((query: string) => ({
    media: query,
    get matches() {
      return state.matches
    },
    addEventListener: (_type: string, listener: () => void) => (state.listener = listener),
    removeEventListener: () => (state.listener = undefined),
  })) as unknown as typeof window.matchMedia
  return state
}

describe('theme', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = ''
  })

  it('lê a preferência guardada e cai em escuro quando não há ou é inválida', () => {
    expect(readPreference()).toBe('dark')
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    expect(readPreference()).toBe('light')
    localStorage.setItem(THEME_STORAGE_KEY, 'roxo')
    expect(readPreference()).toBe('dark')
  })

  it('sem escolha guardada, abre no escuro', () => {
    localStorage.removeItem(THEME_STORAGE_KEY)
    resetThemeForTests()
    expect(getPreference()).toBe('dark')
  })

  it('valor desconhecido no storage vale escuro', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    resetThemeForTests()
    expect(getPreference()).toBe('dark')
  })

  it('não quebra quando o localStorage lança', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(readPreference()).toBe('dark')
    spy.mockRestore()
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(() => savePreference('dark')).not.toThrow()
    setSpy.mockRestore()
  })

  it('resolve sistema pela preferência do aparelho', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('aplica a classe dark e o color-scheme', () => {
    applyTheme('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    applyTheme('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  describe('troca do tema do sistema', () => {
    afterEach(() => {
      // @ts-expect-error o jsdom não declara a propriedade
      delete window.matchMedia
      resetThemeForTests()
    })

    it('em sistema, acompanha o aparelho quando ele troca', () => {
      const media = fakeMatchMedia()
      localStorage.setItem(THEME_STORAGE_KEY, 'system')
      resetThemeForTests()
      const unsubscribe = subscribeTheme(() => {})
      expect(document.documentElement).not.toHaveClass('dark')

      media.matches = true
      media.listener?.()

      expect(document.documentElement).toHaveClass('dark')
      expect(document.documentElement.style.colorScheme).toBe('dark')
      unsubscribe()
    })

    it('em claro, a troca do aparelho não muda nada', () => {
      const media = fakeMatchMedia()
      resetThemeForTests()
      setPreference('light')
      const unsubscribe = subscribeTheme(() => {})

      media.matches = true
      media.listener?.()

      expect(document.documentElement).not.toHaveClass('dark')
      unsubscribe()
    })
  })
})
