import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider, type InitialEntry } from 'react-router'
import { makeStore, type AppStore } from '@/app/store'
import { routes } from '@/app/routes'
import { sessionEnded, sessionStarted } from '@/features/auth/slice'
import { careerApi } from '@/features/career/api'
import type { CareerProfile } from '@/features/career/types'
import { admin, candidate, careerProfile } from './fixtures'

export function anonymousStore() {
  const store = makeStore()
  store.dispatch(sessionEnded())
  return store
}

export function adminStore() {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'access-1', user: admin }))
  return store
}

export function renderWithProviders(ui: ReactElement, store: AppStore = makeStore()) {
  return { store, ...render(<Provider store={store}>{ui}</Provider>) }
}

export function renderRoute(path: InitialEntry, options: { store?: AppStore } = {}) {
  const store = options.store ?? makeStore()
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return {
    store,
    router,
    ...render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>,
    ),
  }
}

export function storeWithGoal(profile: CareerProfile = careerProfile) {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
  store.dispatch(
    careerApi.util.upsertQueryEntries([
      { endpointName: 'getCareerProfile', arg: undefined, value: profile },
    ]),
  )
  return store
}
