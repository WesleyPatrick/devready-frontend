import type { AppDispatch } from '@/app/store'
import { endSession, isSessionRejected } from '@/lib/api'
import { withRefreshLock } from '@/lib/refreshLock'
import { refreshTokenStorage } from '@/lib/refreshTokenStorage'
import { authApi } from './api'
import { sessionEnded } from './slice'

export function restoreSession() {
  return async (dispatch: AppDispatch) => {
    if (!refreshTokenStorage.get()) {
      dispatch(sessionEnded())
      return
    }
    await withRefreshLock(async () => {
      const refreshToken = refreshTokenStorage.get()
      if (!refreshToken) {
        dispatch(sessionEnded())
        return
      }
      const result = await dispatch(authApi.endpoints.refresh.initiate({ refreshToken }))
      if (!('error' in result)) {
        if (result.data) refreshTokenStorage.set(result.data.refreshToken)
        return
      }
      if (isSessionRejected(result.error)) endSession(dispatch)
      else dispatch(sessionEnded())
    })
  }
}
