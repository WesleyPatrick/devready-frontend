import { useEffect } from 'react'
import { useLocation } from 'react-router'

function idFromHash(hash: string) {
  const raw = hash.slice(1)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function useScrollToHash(settled: boolean) {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const target = document.getElementById(idFromHash(hash))
    if (!target) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }, [hash, settled])
}
