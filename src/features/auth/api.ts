import { api, endSession, REFRESH_TIMEOUT_MS } from '@/lib/api'
import { claimDrafts } from '@/lib/draftOwner'
import { getProblem } from '@/lib/problem'
import { refreshTokenStorage } from '@/lib/refreshTokenStorage'
import { sessionStarted, userUpdated } from './slice'
import type { AuthProvidersResponse, AuthTokensResponse, CurrentUser } from './types'

export type RegisterBody = { email: string; password: string; displayName: string }
export type LoginBody = { email: string; password: string }
export type UpdateProfileBody = {
  displayName: string
  avatarUrl: string | null
  currentPassword?: string
  newPassword?: string
}

async function startSession(
  queryFulfilled: Promise<{ data: AuthTokensResponse }>,
  dispatch: (action: unknown) => unknown,
) {
  try {
    const { data } = await queryFulfilled
    refreshTokenStorage.set(data.refreshToken)
    claimDrafts(data.user.id)
    dispatch(sessionStarted({ accessToken: data.accessToken, user: data.user }))
  } catch {}
}

async function endSessionAfter(
  queryFulfilled: Promise<unknown>,
  dispatch: Parameters<typeof endSession>[0],
) {
  try {
    await queryFulfilled
  } catch {
  } finally {
    endSession(dispatch)
  }
}

export function isPasswordConflict(error: unknown) {
  return getProblem(error)?.status === 409
}

export type ReplaceTemporaryPasswordBody = Required<UpdateProfileBody>

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAuthProviders: build.query<AuthProvidersResponse, void>({
      query: () => '/api/v1/auth/providers',
    }),
    register: build.mutation<AuthTokensResponse, RegisterBody>({
      query: (body) => ({ url: '/api/v1/auth/register', method: 'POST', body }),
      onQueryStarted: (_arg, { dispatch, queryFulfilled }) =>
        startSession(queryFulfilled, dispatch),
    }),
    login: build.mutation<AuthTokensResponse, LoginBody>({
      query: (body) => ({ url: '/api/v1/auth/login', method: 'POST', body }),
      onQueryStarted: (_arg, { dispatch, queryFulfilled }) =>
        startSession(queryFulfilled, dispatch),
    }),
    exchangeCode: build.mutation<AuthTokensResponse, { code: string }>({
      query: (body) => ({ url: '/api/v1/auth/exchange', method: 'POST', body }),
      onQueryStarted: (_arg, { dispatch, queryFulfilled }) =>
        startSession(queryFulfilled, dispatch),
    }),
    refresh: build.mutation<AuthTokensResponse, { refreshToken: string }>({
      query: (body) => ({
        url: '/api/v1/auth/refresh',
        method: 'POST',
        body,
        timeout: REFRESH_TIMEOUT_MS,
      }),
      onQueryStarted: (_arg, { dispatch, queryFulfilled }) =>
        startSession(queryFulfilled, dispatch),
    }),
    logout: build.mutation<void, void>({
      queryFn: async (_arg, _api, _extra, baseQuery) => {
        const refreshToken = refreshTokenStorage.get()
        if (!refreshToken) return { data: undefined }
        const result = await baseQuery({
          url: '/api/v1/auth/logout',
          method: 'POST',
          body: { refreshToken },
        })
        return result.error ? { error: result.error } : { data: undefined }
      },
      onQueryStarted: (_arg, { dispatch, queryFulfilled }) =>
        endSessionAfter(queryFulfilled, dispatch),
    }),
    logoutAll: build.mutation<void, void>({
      query: () => ({ url: '/api/v1/auth/logout-all', method: 'POST' }),
      onQueryStarted: (_arg, { dispatch, queryFulfilled }) =>
        endSessionAfter(queryFulfilled, dispatch),
    }),
    updateProfile: build.mutation<CurrentUser, UpdateProfileBody>({
      query: (body) => ({ url: '/api/v1/me', method: 'PATCH', body }),
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          dispatch(userUpdated(data))
        } catch {}
      },
    }),
    replaceTemporaryPassword: build.mutation<CurrentUser, ReplaceTemporaryPasswordBody>({
      query: (body) => ({ url: '/api/v1/me', method: 'PATCH', body }),
    }),
  }),
})

export const {
  useGetAuthProvidersQuery,
  useRegisterMutation,
  useLoginMutation,
  useExchangeCodeMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useUpdateProfileMutation,
  useReplaceTemporaryPasswordMutation,
} = authApi
