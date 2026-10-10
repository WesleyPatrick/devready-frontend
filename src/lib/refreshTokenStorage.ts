const KEY = 'devready.refreshToken'

export const refreshTokenStorage = {
  get(): string | null {
    try {
      return window.localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      window.localStorage.setItem(KEY, token)
    } catch {}
  },
  clear() {
    try {
      window.localStorage.removeItem(KEY)
    } catch {}
  },
}
