import { currentItemKey, readCurrentItem, saveCurrentItem } from './currentItem'

afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('item atual guardado na aba', () => {
  it('guarda e lê por sessão, na chave combinada', () => {
    saveCurrentItem('s1', { kind: 'challenge', position: 2 })
    expect(sessionStorage.getItem('devready-session-item:s1')).toBe(
      JSON.stringify({ kind: 'challenge', position: 2 }),
    )
    expect(currentItemKey('s1')).toBe('devready-session-item:s1')
    expect(readCurrentItem('s1')).toEqual({ kind: 'challenge', position: 2 })
    expect(readCurrentItem('s2')).toBeUndefined()
  })

  it('valor estragado vira "sem item"', () => {
    for (const bad of ['{', '"x"', '{"kind":"outro","position":1}', '{"kind":"question"}']) {
      sessionStorage.setItem(currentItemKey('s1'), bad)
      expect(readCurrentItem('s1')).toBeUndefined()
    }
  })

  it('sem o armazenamento, nem lê nem grava e nada estoura', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(() => saveCurrentItem('s1', { kind: 'question', position: 1 })).not.toThrow()
    expect(readCurrentItem('s1')).toBeUndefined()
  })
})
