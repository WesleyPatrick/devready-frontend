import { http, HttpResponse } from 'msw'
import { REFRESH_TIMEOUT_MS } from '@/lib/api'
import { server } from '@/test/server'
import { problem } from '@/test/handlers'
import { makeStore } from '@/app/store'
import { refreshTokenStorage } from '@/lib/refreshTokenStorage'
import { catalogApi } from '@/features/catalog/api'
import { candidate } from '@/test/fixtures'
import { installFakeLocks, removeFakeLocks } from '@/test/locks'
import { restoreSession } from './restoreSession'

describe('restoreSession', () => {
  beforeEach(() => refreshTokenStorage.clear())

  it('sem refresh token marca anônimo sem chamar a API', async () => {
    const store = makeStore()
    await store.dispatch(restoreSession())
    expect(store.getState().auth.status).toBe('anonymous')
  })

  it('com refresh token válido restaura a sessão', async () => {
    refreshTokenStorage.set('refresh-1')
    const store = makeStore()
    await store.dispatch(restoreSession())
    expect(store.getState().auth).toMatchObject({
      status: 'authenticated',
      accessToken: 'access-2',
    })
    expect(refreshTokenStorage.get()).toBe('refresh-2')
  })

  it('com refresh token inválido limpa e marca anônimo', async () => {
    refreshTokenStorage.set('refresh-velho')
    server.use(
      http.post('/api/v1/auth/refresh', () => problem(401, 'Não autenticado', 'Sessão inválida.')),
    )
    const store = makeStore()
    await store.dispatch(restoreSession())
    expect(store.getState().auth.status).toBe('anonymous')
    expect(refreshTokenStorage.get()).toBeNull()
  })

  it('com refresh token recusado (403) também limpa o storage', async () => {
    refreshTokenStorage.set('refresh-1')
    server.use(
      http.post('/api/v1/auth/refresh', () => problem(403, 'Conta inativa', 'Conta desativada.')),
    )
    const store = makeStore()
    await store.dispatch(restoreSession())
    expect(store.getState().auth.status).toBe('anonymous')
    expect(refreshTokenStorage.get()).toBeNull()
  })

  it('sem conseguir falar com o servidor, marca anônimo mas guarda o refresh token', async () => {
    refreshTokenStorage.set('refresh-1')
    server.use(http.post('/api/v1/auth/refresh', () => HttpResponse.error()))
    const store = makeStore()
    await store.dispatch(restoreSession())
    expect(store.getState().auth.status).toBe('anonymous')
    expect(refreshTokenStorage.get()).toBe('refresh-1')
  })

  it('com erro 5xx no refresh, marca anônimo mas guarda o refresh token', async () => {
    refreshTokenStorage.set('refresh-1')
    server.use(http.post('/api/v1/auth/refresh', () => problem(503, 'Indisponível', 'Fora do ar.')))
    const store = makeStore()
    await store.dispatch(restoreSession())
    expect(store.getState().auth.status).toBe('anonymous')
    expect(refreshTokenStorage.get()).toBe('refresh-1')
  })

  it('limpa o cache da API quando o refresh é recusado', async () => {
    refreshTokenStorage.set('refresh-1')
    const store = makeStore()
    await store.dispatch(restoreSession())
    await store.dispatch(catalogApi.endpoints.getAreas.initiate())
    expect(catalogApi.endpoints.getAreas.select()(store.getState()).data).toBeDefined()

    server.use(
      http.post('/api/v1/auth/refresh', () => problem(401, 'Não autenticado', 'Sessão inválida.')),
    )
    await store.dispatch(restoreSession())

    expect(catalogApi.endpoints.getAreas.select()(store.getState()).data).toBeUndefined()
  })

  describe('com outra aba abrindo ao mesmo tempo', () => {
    afterEach(() => removeFakeLocks())

    it('renova dentro da trava, com o refresh token que a outra aba acabou de gravar', async () => {
      refreshTokenStorage.set('refresh-1')
      const { requested } = installFakeLocks(() => refreshTokenStorage.set('refresh-da-outra-aba'))
      const sent: string[] = []
      server.use(
        http.post('/api/v1/auth/refresh', async ({ request }) => {
          sent.push(((await request.json()) as { refreshToken: string }).refreshToken)
          return HttpResponse.json({
            accessToken: 'access-3',
            refreshToken: 'refresh-3',
            user: candidate,
          })
        }),
      )
      const store = makeStore()

      await store.dispatch(restoreSession())

      expect(requested).toEqual(['devready-refresh'])
      expect(sent).toEqual(['refresh-da-outra-aba'])
      expect(store.getState().auth).toMatchObject({
        status: 'authenticated',
        accessToken: 'access-3',
      })
      expect(refreshTokenStorage.get()).toBe('refresh-3')
    })

    it('se a outra aba saiu enquanto esperava, abre anônimo sem chamar o refresh', async () => {
      refreshTokenStorage.set('refresh-1')
      installFakeLocks(() => refreshTokenStorage.clear())
      let refreshes = 0
      server.use(
        http.post('/api/v1/auth/refresh', () => {
          refreshes++
          return HttpResponse.json({
            accessToken: 'access-3',
            refreshToken: 'refresh-3',
            user: candidate,
          })
        }),
      )
      const store = makeStore()

      await store.dispatch(restoreSession())

      expect(refreshes).toBe(0)
      expect(store.getState().auth.status).toBe('anonymous')
    })
  })

  describe('com o refresh pendurado', () => {
    afterEach(() => vi.useRealTimers())

    it('desiste depois do tempo limite, abre anônimo e guarda o refresh token', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      refreshTokenStorage.set('refresh-1')
      let aborted = false
      server.use(
        http.post('/api/v1/auth/refresh', ({ request }) => {
          request.signal.addEventListener('abort', () => (aborted = true))
          return new Promise<Response>(() => {})
        }),
      )
      const store = makeStore()
      const opening = store.dispatch(restoreSession())

      await vi.advanceTimersByTimeAsync(REFRESH_TIMEOUT_MS)
      await opening

      expect(store.getState().auth.status).toBe('anonymous')
      expect(refreshTokenStorage.get()).toBe('refresh-1')
      expect(aborted).toBe(true)
    })
  })
})
