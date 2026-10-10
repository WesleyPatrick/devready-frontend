import { http, HttpResponse } from 'msw'
import { REFRESH_TIMEOUT_MS } from '@/lib/api'
import { server } from '@/test/server'
import { problem } from '@/test/handlers'
import { makeStore } from '@/app/store'
import { refreshTokenStorage } from '@/lib/refreshTokenStorage'
import { authApi } from './api'
import { sessionStarted } from './slice'
import { catalogApi } from '@/features/catalog/api'
import { admin, areas, candidate, tokens } from '@/test/fixtures'
import { readDraft, saveDraft } from '@/features/challenge/drafts'
import { readSessionDraft, saveSessionDraft } from '@/features/session/drafts'
import { installFakeLocks, removeFakeLocks } from '@/test/locks'

describe('authApi', () => {
  beforeEach(() => refreshTokenStorage.clear())

  it('login guarda o access token no estado e o refresh token no storage', async () => {
    const store = makeStore()
    const result = await store.dispatch(
      authApi.endpoints.login.initiate({ email: 'ana@example.com', password: 'senha-forte' }),
    )

    expect('data' in result && result.data?.user.email).toBe('ana@example.com')
    expect(store.getState().auth).toMatchObject({
      accessToken: 'access-1',
      status: 'authenticated',
    })
    expect(refreshTokenStorage.get()).toBe('refresh-1')
  })

  describe('rascunhos de código no mesmo navegador', () => {
    afterEach(() => localStorage.clear())
    const login = (store: ReturnType<typeof makeStore>) =>
      store.dispatch(
        authApi.endpoints.login.initiate({ email: 'ana@example.com', password: 'senha-forte' }),
      )

    it('a mesma conta, ao entrar de novo, encontra os próprios rascunhos', async () => {
      await login(makeStore())
      saveDraft('two-sum', 'JAVA', 'codigo da Ana')
      saveSessionDraft('sessao-1', 'two-sum', 'JAVA', 'prova da Ana')

      await login(makeStore())

      expect(readDraft('two-sum', 'JAVA')).toBe('codigo da Ana')
      expect(readSessionDraft('sessao-1', 'two-sum', 'JAVA')).toBe('prova da Ana')
    })

    it('outra conta não vê os rascunhos da anterior', async () => {
      await login(makeStore())
      saveDraft('two-sum', 'JAVA', 'codigo da Ana')
      saveSessionDraft('sessao-1', 'two-sum', 'JAVA', 'prova da Ana')
      localStorage.setItem('outra-coisa', 'fica')
      server.use(
        http.post('/api/v1/auth/login', () => HttpResponse.json({ ...tokens, user: admin })),
      )

      await login(makeStore())

      expect(readDraft('two-sum', 'JAVA')).toBeNull()
      expect(readSessionDraft('sessao-1', 'two-sum', 'JAVA')).toBeNull()
      expect(localStorage.getItem('outra-coisa')).toBe('fica')
    })
  })

  it('envia o Bearer nas chamadas autenticadas', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
    let seen = ''
    server.use(
      http.get('/api/v1/areas', ({ request }) => {
        seen = request.headers.get('Authorization') ?? ''
        return HttpResponse.json(areas)
      }),
    )

    await store.dispatch(catalogApi.endpoints.getAreas.initiate())

    expect(seen).toBe('Bearer access-1')
  })

  it('renova o token uma vez em 401 e repete a chamada', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'expired', user: candidate }))
    refreshTokenStorage.set('refresh-1')
    let calls = 0
    server.use(
      http.get('/api/v1/areas', ({ request }) => {
        calls++
        return request.headers.get('Authorization') === 'Bearer access-2'
          ? HttpResponse.json(areas)
          : problem(401, 'Não autenticado', 'Token vencido.')
      }),
    )

    const result = await store.dispatch(catalogApi.endpoints.getAreas.initiate())

    expect(result.data).toHaveLength(3)
    expect(calls).toBe(2)
    expect(store.getState().auth.accessToken).toBe('access-2')
    expect(refreshTokenStorage.get()).toBe('refresh-2')
  })

  it('encerra a sessão quando a renovação falha', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'expired', user: candidate }))
    refreshTokenStorage.set('refresh-velho')
    server.use(
      http.get('/api/v1/areas', () => problem(401, 'Não autenticado', 'Token vencido.')),
      http.post('/api/v1/auth/refresh', () => problem(401, 'Não autenticado', 'Sessão inválida.')),
    )

    const result = await store.dispatch(catalogApi.endpoints.getAreas.initiate())

    expect(result.status).toBe('uninitialized')
    expect(store.getState().auth).toMatchObject({ status: 'anonymous', accessToken: null })
    expect(refreshTokenStorage.get()).toBeNull()
  })

  it('mantém a sessão e o refresh token quando a renovação falha por rede', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'expired', user: candidate }))
    refreshTokenStorage.set('refresh-1')
    server.use(
      http.get('/api/v1/areas', () => problem(401, 'Não autenticado', 'Token vencido.')),
      http.post('/api/v1/auth/refresh', () => HttpResponse.error()),
    )

    const result = await store.dispatch(catalogApi.endpoints.getAreas.initiate())

    expect('error' in result).toBe(true)
    expect(store.getState().auth).toMatchObject({ status: 'authenticated', accessToken: 'expired' })
    expect(refreshTokenStorage.get()).toBe('refresh-1')
  })

  it('mantém a sessão e o refresh token quando a renovação falha com 5xx', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'expired', user: candidate }))
    refreshTokenStorage.set('refresh-1')
    server.use(
      http.get('/api/v1/areas', () => problem(401, 'Não autenticado', 'Token vencido.')),
      http.post('/api/v1/auth/refresh', () => problem(500, 'Erro interno', 'Falhou.')),
    )

    await store.dispatch(catalogApi.endpoints.getAreas.initiate())

    expect(store.getState().auth.status).toBe('authenticated')
    expect(refreshTokenStorage.get()).toBe('refresh-1')
  })

  it('limpa o cache da API quando o reauth encerra a sessão', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
    refreshTokenStorage.set('refresh-velho')
    await store.dispatch(catalogApi.endpoints.getAreas.initiate())
    expect(catalogApi.endpoints.getAreas.select()(store.getState()).data).toHaveLength(3)

    server.use(
      http.get('/api/v1/areas', () => problem(401, 'Não autenticado', 'Token vencido.')),
      http.post('/api/v1/auth/refresh', () => problem(401, 'Não autenticado', 'Sessão inválida.')),
    )
    await store.dispatch(catalogApi.endpoints.getAreas.initiate(undefined, { forceRefetch: true }))

    expect(store.getState().auth.status).toBe('anonymous')
    expect(catalogApi.endpoints.getAreas.select()(store.getState()).data).toBeUndefined()
  })

  it('limpa o cache da API quando não há refresh token para renovar', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
    await store.dispatch(catalogApi.endpoints.getAreas.initiate())
    expect(catalogApi.endpoints.getAreas.select()(store.getState()).data).toHaveLength(3)

    server.use(http.get('/api/v1/areas', () => problem(401, 'Não autenticado', 'Token vencido.')))
    await store.dispatch(catalogApi.endpoints.getAreas.initiate(undefined, { forceRefetch: true }))

    expect(store.getState().auth.status).toBe('anonymous')
    expect(catalogApi.endpoints.getAreas.select()(store.getState()).data).toBeUndefined()
  })

  it('logout limpa estado e storage', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
    refreshTokenStorage.set('refresh-1')

    await store.dispatch(authApi.endpoints.logout.initiate())

    expect(store.getState().auth.status).toBe('anonymous')
    expect(refreshTokenStorage.get()).toBeNull()
  })

  it('não manda o Bearer no refresh nem no logout, mesmo com sessão aberta', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'vencido', user: candidate }))
    refreshTokenStorage.set('refresh-1')

    const refreshed = await store.dispatch(
      authApi.endpoints.refresh.initiate({ refreshToken: 'refresh-1' }),
    )
    expect('data' in refreshed).toBe(true)
    expect(store.getState().auth.accessToken).toBe('access-2')
    expect(refreshTokenStorage.get()).toBe('refresh-2')

    let logoutBody: unknown = null
    let logoutAuthorization: string | null = 'não lido'
    server.use(
      http.post('/api/v1/auth/logout', async ({ request }) => {
        logoutAuthorization = request.headers.get('Authorization')
        logoutBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await store.dispatch(authApi.endpoints.logout.initiate())

    expect(logoutAuthorization).toBeNull()
    expect(logoutBody).toEqual({ refreshToken: 'refresh-2' })
    expect(store.getState().auth.status).toBe('anonymous')
    expect(refreshTokenStorage.get()).toBeNull()
  })

  it('logout com falha na API encerra a sessão local sem erro não tratado', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
    refreshTokenStorage.set('refresh-1')
    server.use(http.post('/api/v1/auth/logout', () => problem(500, 'Erro interno', 'Falhou.')))

    const result = await store.dispatch(authApi.endpoints.logout.initiate())

    expect('error' in result).toBe(true)
    expect(store.getState().auth.status).toBe('anonymous')
    expect(refreshTokenStorage.get()).toBeNull()
  })

  it('logout de todos os dispositivos com falha na API também encerra a sessão local', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
    refreshTokenStorage.set('refresh-1')
    server.use(http.post('/api/v1/auth/logout-all', () => HttpResponse.error()))

    await store.dispatch(authApi.endpoints.logoutAll.initiate())

    expect(store.getState().auth.status).toBe('anonymous')
    expect(refreshTokenStorage.get()).toBeNull()
  })

  it('logout sem refresh token guardado não chama a API', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
    let calls = 0
    server.use(
      http.post('/api/v1/auth/logout', () => {
        calls += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await store.dispatch(authApi.endpoints.logout.initiate())

    expect(calls).toBe(0)
    expect(store.getState().auth.status).toBe('anonymous')
  })

  it('atualizar perfil atualiza o usuário no estado', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))

    await store.dispatch(
      authApi.endpoints.updateProfile.initiate({ displayName: 'Ana Souza', avatarUrl: null }),
    )

    expect(store.getState().auth.user?.displayName).toBe('Ana Souza')
  })

  describe('com outra aba renovando ao mesmo tempo', () => {
    afterEach(() => removeFakeLocks())

    it('renova dentro da trava e com o refresh token que a outra aba gravou', async () => {
      const store = makeStore()
      store.dispatch(sessionStarted({ accessToken: 'expired', user: candidate }))
      refreshTokenStorage.set('refresh-1')
      const { requested } = installFakeLocks(() => refreshTokenStorage.set('refresh-da-outra-aba'))
      const sent: string[] = []
      server.use(
        http.get('/api/v1/areas', ({ request }) =>
          request.headers.get('Authorization') === 'Bearer access-2'
            ? HttpResponse.json(areas)
            : problem(401, 'Não autenticado', 'Token vencido.'),
        ),
        http.post('/api/v1/auth/refresh', async ({ request }) => {
          sent.push(((await request.json()) as { refreshToken: string }).refreshToken)
          return HttpResponse.json({
            accessToken: 'access-2',
            refreshToken: 'refresh-2',
            user: candidate,
          })
        }),
      )

      const result = await store.dispatch(catalogApi.endpoints.getAreas.initiate())

      expect(requested).toEqual(['devready-refresh'])
      expect(sent).toEqual(['refresh-da-outra-aba'])
      expect(result.data).toEqual(areas)
      expect(refreshTokenStorage.get()).toBe('refresh-2')
    })

    it('se a outra aba saiu enquanto esperava, encerra a sessão sem chamar o refresh', async () => {
      const store = makeStore()
      store.dispatch(sessionStarted({ accessToken: 'expired', user: candidate }))
      refreshTokenStorage.set('refresh-1')
      installFakeLocks(() => refreshTokenStorage.clear())
      let refreshes = 0
      server.use(
        http.get('/api/v1/areas', () => problem(401, 'Não autenticado', 'Token vencido.')),
        http.post('/api/v1/auth/refresh', () => {
          refreshes++
          return problem(401, 'Não autenticado', 'Sessão inválida.')
        }),
      )

      await store.dispatch(catalogApi.endpoints.getAreas.initiate())

      expect(refreshes).toBe(0)
      expect(store.getState().auth.status).toBe('anonymous')
    })
  })

  describe('com o refresh pendurado no meio da sessão', () => {
    afterEach(() => vi.useRealTimers())

    it('devolve o 401 original depois do tempo limite e não trava a chamada seguinte', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const store = makeStore()
      store.dispatch(sessionStarted({ accessToken: 'expired', user: candidate }))
      refreshTokenStorage.set('refresh-1')
      server.use(
        http.get('/api/v1/areas', () => problem(401, 'Não autenticado', 'Token vencido.')),
        http.post('/api/v1/auth/refresh', () => new Promise<Response>(() => {})),
      )

      const first = store.dispatch(catalogApi.endpoints.getAreas.initiate())
      await vi.advanceTimersByTimeAsync(REFRESH_TIMEOUT_MS)
      const result = await first

      expect(result.error).toMatchObject({ status: 401 })
      expect(store.getState().auth).toMatchObject({
        status: 'authenticated',
        accessToken: 'expired',
      })
      expect(refreshTokenStorage.get()).toBe('refresh-1')

      server.use(http.get('/api/v1/areas', () => HttpResponse.json(areas)))
      const second = await store.dispatch(
        catalogApi.endpoints.getAreas.initiate(undefined, { forceRefetch: true }),
      )
      expect(second.data).toEqual(areas)
    })
  })
})
