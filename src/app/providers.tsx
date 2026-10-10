import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import { SessionRestorer } from './SessionRestorer'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <SessionRestorer>{children}</SessionRestorer>
    </Provider>
  )
}
