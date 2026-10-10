import type { ItemKey } from './slice'
import type { Session } from './types'

export type SessionItem = { key: ItemKey; number: number; title: string; done: boolean }

export function itemsOf(session: Session): SessionItem[] {
  const questions = session.questions.map((q, i) => ({
    key: { kind: 'question' as const, position: q.position },
    number: i + 1,
    title: q.title,
    done: q.chosenOptionId !== null,
  }))
  const challenges = session.challenges.map((c, i) => ({
    key: { kind: 'challenge' as const, position: c.position },
    number: questions.length + i + 1,
    title: c.title,
    done: c.submissionsUsed > 0,
  }))
  return [...questions, ...challenges]
}

export function sameItem(a: ItemKey, b: ItemKey) {
  return a.kind === b.kind && a.position === b.position
}
