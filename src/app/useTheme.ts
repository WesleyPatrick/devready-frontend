import { useSyncExternalStore } from 'react'
import { getPreference, setPreference, subscribeTheme } from './theme'

export function useTheme() {
  const preference = useSyncExternalStore(subscribeTheme, getPreference)
  return { preference, setPreference }
}
