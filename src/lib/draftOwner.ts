const OWNER_KEY = 'devready-draft-owner'

const DRAFT_PREFIXES = ['devready-draft:', 'devready-session-draft:']

export function claimDrafts(userId: string) {
  try {
    if (localStorage.getItem(OWNER_KEY) === userId) return
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
    for (const key of keys) {
      if (key && DRAFT_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key)
      }
    }
    localStorage.setItem(OWNER_KEY, userId)
  } catch {}
}
