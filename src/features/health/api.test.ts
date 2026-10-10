import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import { candidate } from '@/test/fixtures'
import { healthApi } from './api'

describe('healthApi.getHealth', () => {
  it('devolve o JSON quando a resposta é 2xx', async () => {
    const store = makeStore()
    const result = await store.dispatch(healthApi.endpoints.getHealth.initiate())
    expect(result.data).toEqual({ status: 'UP' })
  })

  it('devolve erro com o status HTTP quando a resposta não é 2xx', async () => {
    server.use(
      http.get('/actuator/health', () => HttpResponse.json({ status: 'DOWN' }, { status: 503 })),
    )
    const store = makeStore()
    const result = await store.dispatch(healthApi.endpoints.getHealth.initiate())
    expect(result.error).toMatchObject({ status: 503 })
  })

  it('não manda o Bearer para o actuator', async () => {
    let authorization: string | null = 'não lido'
    server.use(
      http.get('/actuator/health', ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json({ status: 'UP' })
      }),
    )
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))

    await store.dispatch(healthApi.endpoints.getHealth.initiate())

    expect(authorization).toBeNull()
  })
})
