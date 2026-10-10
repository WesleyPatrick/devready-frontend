import type { ChallengeLanguage } from './types'

const LAST_LANGUAGE_KEY = 'devready-challenge-language'
const LANGUAGES: readonly ChallengeLanguage[] = ['JAVA', 'PYTHON', 'JAVASCRIPT']

const BY_STACK: Record<string, ChallengeLanguage> = {
  'java-spring': 'JAVA',
  python: 'PYTHON',
  node: 'JAVASCRIPT',
  react: 'JAVASCRIPT',
  'angular-vue': 'JAVASCRIPT',
}

export function languageForStack(stack?: string): ChallengeLanguage {
  return (stack && BY_STACK[stack]) || 'JAVA'
}

function readLastLanguage(): ChallengeLanguage | null {
  try {
    const value = localStorage.getItem(LAST_LANGUAGE_KEY)
    return LANGUAGES.includes(value as ChallengeLanguage) ? (value as ChallengeLanguage) : null
  } catch {
    return null
  }
}

export function saveLastLanguage(language: ChallengeLanguage) {
  try {
    localStorage.setItem(LAST_LANGUAGE_KEY, language)
  } catch {}
}

export function initialLanguage(offered: ChallengeLanguage[], stack?: string): ChallengeLanguage {
  const last = readLastLanguage()
  if (last && offered.includes(last)) return last
  const byStack = languageForStack(stack)
  return offered.includes(byStack) ? byStack : offered[0]
}
