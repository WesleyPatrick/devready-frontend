import { authReducer, sessionEnded, sessionStarted, tokenRefreshed, userUpdated } from './slice'
import { candidate } from '@/test/fixtures'

describe('auth slice', () => {
  const initial = authReducer(undefined, { type: '@@init' })

  it('começa sem sessão conhecida', () => {
    expect(initial).toEqual({ accessToken: null, user: null, status: 'unknown', notice: null })
  })

  it('guarda token e usuário ao iniciar a sessão', () => {
    const state = authReducer(initial, sessionStarted({ accessToken: 'abc', user: candidate }))
    expect(state).toEqual({
      accessToken: 'abc',
      user: candidate,
      status: 'authenticated',
      notice: null,
    })
  })

  it('troca o token e o usuário ao renovar, e atualiza o usuário no perfil', () => {
    let state = authReducer(initial, sessionStarted({ accessToken: 'abc', user: candidate }))
    state = authReducer(
      state,
      tokenRefreshed({ accessToken: 'def', user: { ...candidate, displayName: 'Ana S.' } }),
    )
    expect(state.accessToken).toBe('def')
    expect(state.user?.displayName).toBe('Ana S.')
    state = authReducer(state, userUpdated({ ...candidate, hasPassword: true }))
    expect(state.user?.hasPassword).toBe(true)
  })

  it('limpa tudo ao encerrar', () => {
    const state = authReducer(
      authReducer(initial, sessionStarted({ accessToken: 'abc', user: candidate })),
      sessionEnded(),
    )
    expect(state).toEqual({ accessToken: null, user: null, status: 'anonymous', notice: null })
  })

  it('guarda o aviso do encerramento até a próxima sessão', () => {
    let state = authReducer(initial, sessionStarted({ accessToken: 'abc', user: candidate }))
    state = authReducer(state, sessionEnded('password-changed'))
    expect(state).toMatchObject({ status: 'anonymous', notice: 'password-changed' })
    state = authReducer(state, sessionStarted({ accessToken: 'def', user: candidate }))
    expect(state.notice).toBeNull()
  })
})
