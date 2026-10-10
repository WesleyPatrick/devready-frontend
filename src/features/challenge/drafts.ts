import type { Challenge, ChallengeLanguage } from './types'

export const draftKey = (slug: string, language: ChallengeLanguage) =>
  `devready-draft:${slug}:${language}`

export function readDraft(slug: string, language: ChallengeLanguage): string | null {
  try {
    return localStorage.getItem(draftKey(slug, language))
  } catch {
    return null
  }
}

export function saveDraft(slug: string, language: ChallengeLanguage, code: string) {
  try {
    localStorage.setItem(draftKey(slug, language), code)
  } catch {}
}

export function clearDraft(slug: string, language: ChallengeLanguage) {
  try {
    localStorage.removeItem(draftKey(slug, language))
  } catch {}
}

export function codesFor(challenge: Challenge): Record<ChallengeLanguage, string> {
  return Object.fromEntries(
    challenge.languages.map((l) => [
      l.language,
      readDraft(challenge.slug, l.language) ?? l.starterCode,
    ]),
  ) as Record<ChallengeLanguage, string>
}
