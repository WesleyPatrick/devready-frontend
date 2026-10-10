import type { ChallengeLanguage } from '@/features/challenge/types'
import type { SessionChallenge } from './types'

export const sessionDraftKey = (sessionId: string, slug: string, language: ChallengeLanguage) =>
  `devready-session-draft:${sessionId}:${slug}:${language}`

export function readSessionDraft(sessionId: string, slug: string, language: ChallengeLanguage) {
  try {
    return localStorage.getItem(sessionDraftKey(sessionId, slug, language))
  } catch {
    return null
  }
}

export function saveSessionDraft(
  sessionId: string,
  slug: string,
  language: ChallengeLanguage,
  code: string,
) {
  try {
    localStorage.setItem(sessionDraftKey(sessionId, slug, language), code)
  } catch {}
}

export function clearSessionDraft(sessionId: string, slug: string, language: ChallengeLanguage) {
  try {
    localStorage.removeItem(sessionDraftKey(sessionId, slug, language))
  } catch {}
}

export function sessionCodesFor(
  sessionId: string,
  challenge: Pick<SessionChallenge, 'slug' | 'languages'>,
): Record<ChallengeLanguage, string> {
  return Object.fromEntries(
    challenge.languages.map((l) => [
      l.language,
      readSessionDraft(sessionId, challenge.slug, l.language) ?? l.starterCode,
    ]),
  ) as Record<ChallengeLanguage, string>
}
