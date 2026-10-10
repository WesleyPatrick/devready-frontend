import { practiceChallenge, TWO_SUM_STARTERS } from '@/test/challenge'
import { clearDraft, codesFor, saveDraft } from './drafts'

describe('rascunhos', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('guarda por desafio e linguagem, e o que não tem rascunho abre no código inicial', () => {
    saveDraft('two-sum', 'JAVA', 'em Java')
    saveDraft('two-sum', 'PYTHON', 'em Python')

    expect(localStorage.getItem('devready-draft:two-sum:JAVA')).toBe('em Java')
    expect(codesFor(practiceChallenge())).toEqual({
      JAVA: 'em Java',
      PYTHON: 'em Python',
      JAVASCRIPT: TWO_SUM_STARTERS.JAVASCRIPT,
    })

    clearDraft('two-sum', 'JAVA')
    expect(codesFor(practiceChallenge()).JAVA).toBe(TWO_SUM_STARTERS.JAVA)
  })

  it('sem armazenamento, abre no código inicial e nada quebra', () => {
    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new Error('bloqueado')
      })
    }

    expect(() => saveDraft('two-sum', 'JAVA', 'x')).not.toThrow()
    expect(() => clearDraft('two-sum', 'JAVA')).not.toThrow()
    expect(codesFor(practiceChallenge()).JAVA).toBe(TWO_SUM_STARTERS.JAVA)
  })
})
