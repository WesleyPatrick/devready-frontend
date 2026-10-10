import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { adminApi } from './api'
import type { AdminUser } from './types'

export type RevealedPassword = { user: AdminUser; password: string }

export function usePasswordReset() {
  const dispatch = useAppDispatch()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [revealed, setRevealed] = useState<RevealedPassword | null>(null)

  async function generate(user: AdminUser) {
    setBusy(true)
    setError(null)
    const result = await dispatch(
      adminApi.endpoints.resetUserPassword.initiate(user.id, { track: false }),
    )
    setBusy(false)
    if (result.data) {
      setRevealed({ user, password: result.data.temporaryPassword })
      return null
    }
    setError(result.error)
    return result.error
  }

  return {
    busy,
    error,
    revealed,
    generate,
    clearError: () => setError(null),
    forget: () => setRevealed(null),
  }
}
