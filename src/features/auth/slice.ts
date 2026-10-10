import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CurrentUser } from './types'

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous'

export type SessionNotice = 'password-changed' | 'password-conflict'

export type AuthState = {
  accessToken: string | null
  user: CurrentUser | null
  status: SessionStatus
  notice: SessionNotice | null
}

const initialState: AuthState = { accessToken: null, user: null, status: 'unknown', notice: null }

type Session = { accessToken: string; user: CurrentUser }

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<Session>) {
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
      state.status = 'authenticated'
      state.notice = null
    },
    tokenRefreshed(state, action: PayloadAction<Session>) {
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
      state.status = 'authenticated'
      state.notice = null
    },
    userUpdated(state, action: PayloadAction<CurrentUser>) {
      state.user = action.payload
    },
    sessionEnded(state, action: PayloadAction<SessionNotice | undefined>) {
      state.accessToken = null
      state.user = null
      state.status = 'anonymous'
      state.notice = action.payload ?? null
    },
    passwordChangeRequired(state) {
      if (state.user) state.user.mustChangePassword = true
    },
    noticeCleared(state) {
      state.notice = null
    },
  },
})

export const {
  sessionStarted,
  tokenRefreshed,
  userUpdated,
  sessionEnded,
  passwordChangeRequired,
  noticeCleared,
} = slice.actions
export const authReducer = slice.reducer

type WithAuth = { auth: AuthState }
export const selectCurrentUser = (state: WithAuth) => state.auth.user
export const selectSessionStatus = (state: WithAuth) => state.auth.status
export const selectSessionNotice = (state: WithAuth) => state.auth.notice
