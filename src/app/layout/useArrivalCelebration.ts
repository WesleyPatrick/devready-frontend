import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { cannons } from '@/lib/motion/celebrate'

export function useArrivalCelebration() {
  const location = useLocation()
  const navigate = useNavigate()
  const celebrate = (location.state as { celebrate?: unknown } | null)?.celebrate === true
  const done = useRef<string | null>(null)
  useEffect(() => {
    if (!celebrate || done.current === location.key) return
    done.current = location.key
    void cannons()
    navigate(location.pathname + location.search + location.hash, { replace: true, state: null })
  }, [celebrate, location, navigate])
}
