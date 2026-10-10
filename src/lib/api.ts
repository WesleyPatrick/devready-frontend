import { Mutex } from 'async-mutex'
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/app/store'
import {
  passwordChangeRequired,
  sessionEnded,
  tokenRefreshed,
  type SessionNotice,
} from '@/features/auth/slice'
import type { AuthTokensResponse } from '@/features/auth/types'
import { withRefreshLock } from './refreshLock'
import { refreshTokenStorage } from './refreshTokenStorage'

const mutex = new Mutex()

export const REFRESH_TIMEOUT_MS = 10_000

const CREDENTIAL_ROUTES = new Set([
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/exchange',
  '/api/v1/auth/logout',
])

function urlOf(args: string | FetchArgs) {
  return typeof args === 'string' ? args : args.url
}

function takesBearer(url: string) {
  return !CREDENTIAL_ROUTES.has(url) && !url.startsWith('/actuator/') && url !== '/actuator'
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: window.location.origin,
  prepareHeaders: (headers, { getState, arg }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token && takesBearer(urlOf(arg))) headers.set('Authorization', `Bearer ${token}`)
    headers.set('Accept', 'application/json')
    return headers
  },
})

export function isSessionRejected(error: unknown) {
  if (!error || typeof error !== 'object' || !('status' in error)) return false
  const status = (error as { status: unknown }).status
  return status === 401 || status === 403
}

export function endSession(dispatch: BaseQueryApi['dispatch'], notice?: SessionNotice) {
  refreshTokenStorage.clear()
  dispatch(sessionEnded(notice))
  dispatch(api.util.resetApiState())
}

export const PASSWORD_CHANGE_REQUIRED_CODE = 'password_change_required'
export const PASSWORD_CHANGE_REQUIRED_TITLE = 'Senha provisória'

export function isPasswordChangeRequired(error: unknown) {
  if (!error || typeof error !== 'object' || !('status' in error)) return false
  const { status, data } = error as {
    status: unknown
    data?: { code?: unknown; title?: unknown }
  }
  if (status !== 403) return false
  return (
    data?.code === PASSWORD_CHANGE_REQUIRED_CODE || data?.title === PASSWORD_CHANGE_REQUIRED_TITLE
  )
}

const queryWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  queryApi,
  extraOptions,
) => {
  await mutex.waitForUnlock()
  let result = await rawBaseQuery(args, queryApi, extraOptions)
  if (result.error?.status !== 401 || CREDENTIAL_ROUTES.has(urlOf(args))) return result

  const refreshToken = refreshTokenStorage.get()
  if (!refreshToken) {
    if ((queryApi.getState() as RootState).auth.status !== 'anonymous')
      endSession(queryApi.dispatch)
    return result
  }

  if (mutex.isLocked()) {
    await mutex.waitForUnlock()
    return rawBaseQuery(args, queryApi, extraOptions)
  }

  const release = await mutex.acquire()
  try {
    const renewed = await withRefreshLock(async () => {
      const current = refreshTokenStorage.get()
      if (!current) {
        endSession(queryApi.dispatch)
        return false
      }
      const refreshed = await rawBaseQuery(
        {
          url: '/api/v1/auth/refresh',
          method: 'POST',
          body: { refreshToken: current },
          timeout: REFRESH_TIMEOUT_MS,
        },
        queryApi,
        extraOptions,
      )
      if (refreshed.data) {
        const tokens = refreshed.data as AuthTokensResponse
        refreshTokenStorage.set(tokens.refreshToken)
        queryApi.dispatch(tokenRefreshed({ accessToken: tokens.accessToken, user: tokens.user }))
        return true
      }
      if (isSessionRejected(refreshed.error)) endSession(queryApi.dispatch)
      return false
    })
    if (renewed) result = await rawBaseQuery(args, queryApi, extraOptions)
  } finally {
    release()
  }
  return result
}

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, queryApi, extraOptions) => {
  const result = await queryWithRefresh(args, queryApi, extraOptions)
  if (isPasswordChangeRequired(result.error)) queryApi.dispatch(passwordChangeRequired())
  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'CareerProfile',
    'Track',
    'Question',
    'Progress',
    'Achievement',
    'Challenge',
    'Submission',
    'Session',
    'AdminUser',
  ],
  endpoints: () => ({}),
})
