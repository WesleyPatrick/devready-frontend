import { waitFor } from '@testing-library/react'
import { http } from 'msw'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import { candidate, careerOptions, careerProfile } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { server } from '@/test/server'
import { challengeApi } from '@/features/challenge/api'
import { careerApi } from './api'

describe('careerApi', () => {
  it('busca as opções sem precisar de sessão', async () => {
    const store = makeStore()
    const result = await store.dispatch(careerApi.endpoints.getCareerOptions.initiate())
    expect(result.data?.companies).toHaveLength(careerOptions.companies.length)
    expect(result.data?.stacks).toHaveLength(careerOptions.stacks.length)
  })

  it('busca o perfil da pessoa logada', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
    const result = await store.dispatch(careerApi.endpoints.getCareerProfile.initiate())
    expect(result.data).toEqual(careerProfile)
  })

  it('salvar grava o perfil no cache da consulta', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
    await store.dispatch(
      careerApi.endpoints.saveCareerProfile.initiate({
        companies: ['ifood'],
        stack: 'react',
        seniority: 'PLENO',
      }),
    )
    const cached = careerApi.endpoints.getCareerProfile.select()(store.getState())
    expect(cached.data?.companies[0].slug).toBe('ifood')
    expect(cached.data?.stack.slug).toBe('react')
    expect(cached.data?.seniority).toBe('PLENO')
  })

  it('salvar depois do 404 troca o erro pelo perfil, antes de a mutation devolver', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
    server.use(
      http.get(
        '/api/v1/career/profile',
        () => problem(404, 'Não encontrado', 'Perfil de carreira ainda não preenchido.'),
        { once: true },
      ),
    )
    await store.dispatch(careerApi.endpoints.getCareerProfile.initiate())
    expect(careerApi.endpoints.getCareerProfile.select()(store.getState()).isError).toBe(true)

    await store
      .dispatch(
        careerApi.endpoints.saveCareerProfile.initiate({
          companies: ['nubank', 'google'],
          stack: 'java-spring',
          seniority: 'JUNIOR',
        }),
      )
      .unwrap()

    const cached = careerApi.endpoints.getCareerProfile.select()(store.getState())
    expect(cached.isSuccess).toBe(true)
    expect(cached.error).toBeUndefined()
    expect(cached.data).toEqual(careerProfile)
  })

  it('salvar o objetivo lê de novo o detalhe do desafio', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
    const challenge = store.dispatch(challengeApi.endpoints.getChallenge.initiate('two-sum'))
    await challenge
    const before = challengeApi.endpoints.getChallenge.select('two-sum')(store.getState()).requestId

    await store
      .dispatch(
        careerApi.endpoints.saveCareerProfile.initiate({
          companies: ['ifood'],
          stack: 'react',
          seniority: 'PLENO',
        }),
      )
      .unwrap()

    await waitFor(() =>
      expect(
        challengeApi.endpoints.getChallenge.select('two-sum')(store.getState()).requestId,
      ).not.toBe(before),
    )
    challenge.unsubscribe()
  })
})
