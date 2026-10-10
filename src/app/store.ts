import { configureStore } from '@reduxjs/toolkit'
import { api } from '@/lib/api'
import { authReducer } from '@/features/auth/slice'
import { sessionUiReducer } from '@/features/session/slice'

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      sessionUi: sessionUiReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    devTools: import.meta.env.DEV,
  })
}

export const store = makeStore()

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
