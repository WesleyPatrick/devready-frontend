export type ThemePreference = 'light' | 'dark' | 'system'
export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'devready-theme'

const PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system']

function parsePreference(value: string | null): ThemePreference {
  return PREFERENCES.includes(value as ThemePreference) ? (value as ThemePreference) : 'dark'
}

export function readPreference(fallback: ThemePreference = 'dark'): ThemePreference {
  try {
    return parsePreference(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return fallback
  }
}

export function savePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {}
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): Theme {
  return preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement) {
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

export function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

let current: ThemePreference | undefined
const listeners = new Set<() => void>()
let media: MediaQueryList | undefined

function update(next: ThemePreference) {
  current = next
  applyTheme(resolveTheme(next, systemPrefersDark()))
  listeners.forEach((listener) => listener())
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== THEME_STORAGE_KEY) return
  update(parsePreference(event.newValue))
}

function onSystemChange() {
  if (current === 'system') applyTheme(resolveTheme('system', systemPrefersDark()))
}

export function getPreference(): ThemePreference {
  current ??= readPreference()
  return current
}

export function resetThemeForTests() {
  current = undefined
}

export function setPreference(next: ThemePreference) {
  savePreference(next)
  update(next)
}

export function subscribeTheme(listener: () => void) {
  if (listeners.size === 0) {
    current = readPreference(current)
    applyTheme(resolveTheme(current, systemPrefersDark()))
    window.addEventListener('storage', onStorage)
    media = window.matchMedia?.('(prefers-color-scheme: dark)')
    media?.addEventListener('change', onSystemChange)
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size > 0) return
    window.removeEventListener('storage', onStorage)
    media?.removeEventListener('change', onSystemChange)
    media = undefined
  }
}
