import type { ItemKey } from './slice'

export const currentItemKey = (sessionId: string) => `devready-session-item:${sessionId}`

export function readCurrentItem(sessionId: string): ItemKey | undefined {
  try {
    const raw = sessionStorage.getItem(currentItemKey(sessionId))
    if (!raw) return undefined
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return undefined
    const { kind, position } = value as { kind?: unknown; position?: unknown }
    if ((kind !== 'question' && kind !== 'challenge') || typeof position !== 'number') {
      return undefined
    }
    return { kind, position }
  } catch {
    return undefined
  }
}

export function saveCurrentItem(sessionId: string, item: ItemKey) {
  try {
    sessionStorage.setItem(currentItemKey(sessionId), JSON.stringify(item))
  } catch {}
}
