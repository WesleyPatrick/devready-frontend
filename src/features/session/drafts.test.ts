import { readSessionDraft, saveSessionDraft, sessionCodesFor, sessionDraftKey } from './drafts'
import type { SessionChallenge } from './types'

afterEach(() => localStorage.clear())

const challenge = {
  slug: 'two-sum',
  languages: [
    { language: 'JAVA', runtime: 'Java 13', functionName: 'twoSum', starterCode: 'inicial java' },
    {
      language: 'PYTHON',
      runtime: 'Python 3.8',
      functionName: 'two_sum',
      starterCode: 'inicial py',
    },
  ],
} as SessionChallenge

it('o rascunho é por sessão, desafio e linguagem, separado do da prática', () => {
  expect(sessionDraftKey('s1', 'two-sum', 'JAVA')).toBe('devready-session-draft:s1:two-sum:JAVA')
  saveSessionDraft('s1', 'two-sum', 'JAVA', 'meu código')

  expect(readSessionDraft('s1', 'two-sum', 'JAVA')).toBe('meu código')
  expect(readSessionDraft('s2', 'two-sum', 'JAVA')).toBeNull()
  expect(localStorage.getItem('devready-draft:two-sum:JAVA')).toBeNull()
  expect(sessionCodesFor('s1', challenge)).toEqual({ JAVA: 'meu código', PYTHON: 'inicial py' })
})
