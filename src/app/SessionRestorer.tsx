import { useEffect, useRef, type ReactNode } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { paths } from '@/app/paths'
import { restoreSession } from '@/features/auth/restoreSession'

export function SessionRestorer({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    if (window.location.pathname.replace(/\/+$/, '') === paths.authCallback) return
    void dispatch(restoreSession())
  }, [dispatch])
  return <>{children}</>
}
