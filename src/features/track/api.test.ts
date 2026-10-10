import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { careerApi } from '@/features/career/api'
import { competencyDetail, track } from '@/test/fixtures'
import { storeWithGoal } from '@/test/render'
import { server } from '@/test/server'
import { trackApi } from './api'

describe('trackApi', () => {
  it('busca a trilha montada pelo backend', async () => {
    const store = storeWithGoal()
    const { data } = await store.dispatch(trackApi.endpoints.getTrack.initiate())
    expect(data).toEqual(track)
  })

  it('busca o detalhe da competência com materiais, questões e desafios', async () => {
    const store = storeWithGoal()
    const { data } = await store.dispatch(
      trackApi.endpoints.getCompetency.initiate('sql-e-modelagem-de-dados'),
    )
    expect(data).toEqual(competencyDetail('sql-e-modelagem-de-dados'))
    expect(data!.questions).toHaveLength(4)
    expect(data!.challenges).toEqual([])
  })

  it('competência fora da trilha dá 404 com o detalhe do backend', async () => {
    const store = storeWithGoal()
    const result = await store.dispatch(trackApi.endpoints.getCompetency.initiate('react'))
    expect(result.error).toMatchObject({
      status: 404,
      data: { detail: 'Competência fora da sua trilha: react.' },
    })
  })

  it('salvar o objetivo busca a trilha de novo', async () => {
    let calls = 0
    server.use(
      http.get('/api/v1/career/track', () => {
        calls += 1
        return HttpResponse.json(track)
      }),
    )
    const store = storeWithGoal()
    const subscription = store.dispatch(trackApi.endpoints.getTrack.initiate())
    await subscription
    expect(calls).toBe(1)
    await store.dispatch(
      careerApi.endpoints.saveCareerProfile.initiate({
        companies: ['ifood'],
        stack: 'react',
        seniority: 'PLENO',
      }),
    )
    await waitFor(() => expect(calls).toBe(2))
    subscription.unsubscribe()
  })
})
