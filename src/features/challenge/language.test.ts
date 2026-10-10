import type { ChallengeLanguage } from './types'
import { initialLanguage, languageForStack, saveLastLanguage } from './language'

const ALL: ChallengeLanguage[] = ['JAVA', 'PYTHON', 'JAVASCRIPT']

describe('linguagem inicial', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it.each([
    ['java-spring', 'JAVA'],
    ['python', 'PYTHON'],
    ['node', 'JAVASCRIPT'],
    ['react', 'JAVASCRIPT'],
    ['angular-vue', 'JAVASCRIPT'],
    ['dotnet', 'JAVA'],
    ['go', 'JAVA'],
    ['kubernetes-cloud', 'JAVA'],
    [undefined, 'JAVA'],
  ])('a stack %s começa em %s', (stack, expected) => {
    expect(languageForStack(stack)).toBe(expected)
  })

  it('depois vale a última escolhida, se o desafio a tiver', () => {
    saveLastLanguage('PYTHON')

    expect(initialLanguage(ALL, 'react')).toBe('PYTHON')
    expect(initialLanguage(['JAVA', 'JAVASCRIPT'], 'react')).toBe('JAVASCRIPT')
  })

  it('valor estranho guardado não vale', () => {
    localStorage.setItem('devready-challenge-language', 'RUBY')

    expect(initialLanguage(ALL, undefined)).toBe('JAVA')
  })

  it('sem armazenamento, vale a stack, e guardar não quebra', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    expect(() => saveLastLanguage('PYTHON')).not.toThrow()
    expect(initialLanguage(ALL, 'python')).toBe('PYTHON')
  })
})
