import { StrictMode } from 'react'
import { render, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store'
import { SessionRestorer } from '@/app/SessionRestorer'
import { refreshTokenStorage } from '@/lib/refreshTokenStorage'
import { tokens } from '@/test/fixtures'
import { server } from '@/test/server'

describe('SessionRestorer', () => {
  const initialPath = window.location.pathname

  afterEach(() => {
    refreshTokenStorage.clear()
    window.history.replaceState(null, '', initialPath)
  })

  it('renova a sessão uma vez só, mesmo com o StrictMode montando duas vezes', async () => {
    refreshTokenStorage.set('refresh-1')
    let calls = 0
    server.use(
      http.post('/api/v1/auth/refresh', () => {
        calls += 1
        return HttpResponse.json({ ...tokens, accessToken: 'access-2', refreshToken: 'refresh-2' })
      }),
    )
    const store = makeStore()

    render(
      <StrictMode>
        <Provider store={store}>
          <SessionRestorer>
            <p>app</p>
          </SessionRestorer>
        </Provider>
      </StrictMode>,
    )

    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'))
    expect(calls).toBe(1)
    expect(refreshTokenStorage.get()).toBe('refresh-2')
  })

  it('não renova a sessão no retorno do login social, que resolve a sessão pela troca do código', async () => {
    window.history.replaceState(null, '', '/auth/callback?code=abc')
    refreshTokenStorage.set('refresh-1')
    let calls = 0
    server.use(
      http.post('/api/v1/auth/refresh', () => {
        calls += 1
        return HttpResponse.json({ ...tokens, accessToken: 'access-2', refreshToken: 'refresh-2' })
      }),
    )
    const store = makeStore()

    render(
      <Provider store={store}>
        <SessionRestorer>
          <p>app</p>
        </SessionRestorer>
      </Provider>,
    )

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(calls).toBe(0)
    expect(store.getState().auth.status).toBe('unknown')
    expect(refreshTokenStorage.get()).toBe('refresh-1')
  })
})
