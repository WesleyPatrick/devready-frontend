import { waitFor } from '@testing-library/react'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import { adminUser, BRUNO_ID, CARLA_ID, ELIS_ID, MISSING_ID, revokedSessions } from '@/test/admin'
import { admin } from '@/test/fixtures'
import { adminApi } from './api'
import { PAGE_SIZE } from './paging'

function signedInAsAdmin() {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'access-1', user: admin }))
  return store
}

const names = (page: { items: { displayName: string }[] } | undefined) =>
  page?.items.map((user) => user.displayName)

describe('adminApi', () => {
  it('lista 20 por página, do cadastro mais novo, com os filtros na consulta', async () => {
    const store = signedInAsAdmin()

    const first = await store
      .dispatch(adminApi.endpoints.getAdminUsers.initiate({ page: 1, size: PAGE_SIZE }))
      .unwrap()
    expect(first.items).toHaveLength(20)
    expect(first.items[0].displayName).toBe('Elis Teste')
    expect(first.totalItems).toBe(24)
    expect(first.totalPages).toBe(2)

    const admins = await store
      .dispatch(
        adminApi.endpoints.getAdminUsers.initiate({
          page: 1,
          size: PAGE_SIZE,
          role: 'ADMIN',
          active: true,
        }),
      )
      .unwrap()
    expect(names(admins)).toEqual(['Bruno Admin', 'Administrador'])

    const search = await store
      .dispatch(
        adminApi.endpoints.getAdminUsers.initiate({ page: 1, size: PAGE_SIZE, q: 'SESSAO' }),
      )
      .unwrap()
    expect(names(search)).toEqual(['Elis Teste'])
  })

  it('desativar grava, encerra as sessões e a lista se atualiza', async () => {
    const store = signedInAsAdmin()
    const filters = { page: 1, size: PAGE_SIZE, active: false }
    const subscription = store.dispatch(adminApi.endpoints.getAdminUsers.initiate(filters))
    expect(names(await subscription.unwrap())).toEqual(['Carla Desafio'])

    const result = await store.dispatch(
      adminApi.endpoints.changeUserAccess.initiate({ id: ELIS_ID, body: { active: false } }),
    )

    expect(result.data?.active).toBe(false)
    expect(adminUser(ELIS_ID).active).toBe(false)
    expect(revokedSessions()).toEqual([ELIS_ID])
    await waitFor(() =>
      expect(
        names(adminApi.endpoints.getAdminUsers.select(filters)(store.getState()).data),
      ).toEqual(['Elis Teste', 'Carla Desafio']),
    )
    await store.dispatch(
      adminApi.endpoints.changeUserAccess.initiate({ id: CARLA_ID, body: { active: true } }),
    )
    expect(revokedSessions()).toEqual([ELIS_ID])
    subscription.unsubscribe()
  })

  it('a própria conta, o pedido vazio e a conta que não existe voltam com o erro da API', async () => {
    const store = signedInAsAdmin()

    const own = await store.dispatch(
      adminApi.endpoints.changeUserAccess.initiate({ id: admin.id, body: { active: false } }),
    )
    expect(own.error).toMatchObject({
      status: 422,
      data: { detail: 'Você não pode alterar a sua própria conta por aqui.' },
    })
    const empty = await store.dispatch(
      adminApi.endpoints.changeUserAccess.initiate({ id: ELIS_ID, body: {} }),
    )
    expect(empty.error).toMatchObject({ status: 400 })
    const missing = await store.dispatch(
      adminApi.endpoints.changeUserAccess.initiate({ id: MISSING_ID, body: { active: false } }),
    )
    expect(missing.error).toMatchObject({
      status: 404,
      data: { detail: 'Usuário não encontrado.' },
    })
    const malformed = await store.dispatch(
      adminApi.endpoints.changeUserAccess.initiate({ id: 'nao-existe', body: { active: false } }),
    )
    expect(malformed.error).toMatchObject({ status: 400 })
  })

  it('quem deixou de ser admin ativo recebe 403 na lista e na mudança', async () => {
    const store = signedInAsAdmin()
    adminUser(admin.id).role = 'CANDIDATE'

    const list = await store.dispatch(
      adminApi.endpoints.getAdminUsers.initiate({ page: 1, size: PAGE_SIZE }),
    )
    expect(list.error).toMatchObject({
      status: 403,
      data: { detail: 'Você não tem mais acesso à gestão de usuários.' },
    })
    const result = await store.dispatch(
      adminApi.endpoints.changeUserAccess.initiate({ id: BRUNO_ID, body: { role: 'CANDIDATE' } }),
    )
    expect(result.error).toMatchObject({
      status: 403,
      data: { detail: 'Você não tem mais acesso à gestão de usuários.' },
    })
    expect(adminUser(BRUNO_ID).role).toBe('ADMIN')

    adminUser(admin.id).role = 'ADMIN'
    adminUser(admin.id).active = false
    const deactivated = await store.dispatch(
      adminApi.endpoints.changeUserAccess.initiate({ id: ELIS_ID, body: { active: false } }),
    )
    expect(deactivated.error).toMatchObject({ status: 403 })
    expect(adminUser(ELIS_ID).active).toBe(true)
  })
})
