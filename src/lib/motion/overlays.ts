import { useEffect, useSyncExternalStore } from 'react'

let open = 0
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit() {
  listeners.forEach((listener) => listener())
}

export function useRegisterOverlay(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return
    open += 1
    emit()
    return () => {
      open = Math.max(0, open - 1)
      emit()
    }
  }, [isOpen])
}

export function useOverlayOpen() {
  return useSyncExternalStore(subscribe, () => open > 0)
}

export function resetOverlaysForTests() {
  open = 0
  emit()
}
