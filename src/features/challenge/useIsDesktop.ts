import { useSyncExternalStore } from 'react'

const DESKTOP = '(min-width: 1024px)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(DESKTOP)
  media?.addEventListener('change', onChange)
  return () => media?.removeEventListener('change', onChange)
}

function snapshot() {
  return window.matchMedia?.(DESKTOP).matches ?? true
}

export function useIsDesktop() {
  return useSyncExternalStore(subscribe, snapshot)
}
