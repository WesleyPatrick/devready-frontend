import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { careerApi } from '@/features/career/api'
import { progressApi } from '@/features/progress/api'
import { trackApi } from '@/features/track/api'
import { track } from '@/test/fixtures'
import { optionOf, practiceProblem, setPracticeSeniority } from '@/test/practice'
import { storeWithGoal } from '@/test/render'
import { server } from '@/test/server'
import { questionsApi } from './api'
import type { QuestionFilters } from './types'

const DAILY = 'backend-junior-java-equals-hashcode'

describe('questões pela API', () => {
  it('lista os problemas da trilha em páginas; desafio vem sem taxa de acerto', async () => {
    const store = storeWithGoal()
    const { data: first } = await store.dispatch(
      questionsApi.endpoints.getQuestions.initiate({ page: 1, size: 10 }),
    )
    expect(first).toMatchObject({ page: 1, totalPages: 2, totalItems: 16 })
    expect(first!.items).toHaveLength(10)
    expect(first!.items[0]).toMatchObject({
      slug: 'valid-parentheses',
      type: 'CHALLENGE',
      status: 'NOT_STARTED',
      acceptance: null,
    })
    const { data: second } = await store.dispatch(
      questionsApi.endpoints.getQuestions.initiate({ page: 2, size: 10 }),
    )
    expect(second!.items).toHaveLength(6)
    expect(second!.items.at(-1)).toMatchObject({ slug: 'backend-junior-git-revert', askedBy: [] })
  })

  it('manda os filtros na consulta e deixa de fora os vazios', async () => {
    const urls: URL[] = []
    server.use(
      http.get('/api/v1/questions', ({ request }) => {
        urls.push(new URL(request.url))
      }),
    )
    const store = storeWithGoal()
    await store.dispatch(
      questionsApi.endpoints.getQuestions.initiate({
        page: 2,
        size: 10,
        type: 'QUESTION',
        status: 'SOLVED',
        difficulty: 'EASY',
        competency: 'sql-e-modelagem-de-dados',
        company: 'google',
      }),
    )
    await store.dispatch(
      questionsApi.endpoints.getQuestions.initiate({ page: 1, size: 10, type: undefined }),
    )
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      page: '2',
      size: '10',
      type: 'QUESTION',
      status: 'SOLVED',
      difficulty: 'EASY',
      competency: 'sql-e-modelagem-de-dados',
      company: 'google',
    })
    expect(Object.fromEntries(urls[1].searchParams)).toEqual({ page: '1', size: '10' })
  })

  it('o backend de prática filtra como a API: tipo, situação, competência e empresa', async () => {
    const store = storeWithGoal()
    const items = async (filters: QuestionFilters) =>
      (await store.dispatch(questionsApi.endpoints.getQuestions.initiate({ size: 50, ...filters })))
        .data!.items
    expect(await items({ type: 'CHALLENGE' })).toHaveLength(4)
    expect((await items({ status: 'SOLVED' })).map((q) => q.slug)).toEqual([
      'backend-junior-sql-foreign-key',
      'backend-junior-sql-inner-join',
      'backend-junior-http-idempotency',
    ])
    expect(await items({ competency: 'sql-e-modelagem-de-dados' })).toHaveLength(4)
    expect(await items({ company: 'google' })).toHaveLength(14)
  })

  it('acertar marca resolvida, soma o XP uma vez só e anda a meta do dia', async () => {
    const store = storeWithGoal()
    const { data: daily } = await store.dispatch(questionsApi.endpoints.getDailyQuestion.initiate())
    expect(daily).toMatchObject({ slug: DAILY, xp: 40, status: 'NOT_STARTED' })
    const { data: before } = await store.dispatch(progressApi.endpoints.getProgress.initiate())
    await store.dispatch(questionsApi.endpoints.getQuestion.initiate(DAILY))
    const result = await store
      .dispatch(
        questionsApi.endpoints.answerQuestion.initiate({
          slug: DAILY,
          optionId: optionOf(DAILY, 'correct').id,
        }),
      )
      .unwrap()
    expect(result).toMatchObject({ correct: true, xpGained: 40 })
    await waitFor(() =>
      expect(progressApi.endpoints.getProgress.select()(store.getState()).data!.xp).toBe(
        before!.xp + 40,
      ),
    )
    const after = progressApi.endpoints.getProgress.select()(store.getState()).data
    expect(before!.dailyGoal).toEqual({ done: 0, target: 3 })
    expect(after!.dailyGoal).toEqual({ done: 1, target: 3 })
    expect(after!.activity.at(-1)!.count).toBe(before!.activity.at(-1)!.count + 1)
    await waitFor(() =>
      expect(questionsApi.endpoints.getQuestion.select(DAILY)(store.getState()).data!.status).toBe(
        'SOLVED',
      ),
    )
    const again = await store
      .dispatch(
        questionsApi.endpoints.answerQuestion.initiate({
          slug: DAILY,
          optionId: optionOf(DAILY, 'correct').id,
        }),
      )
      .unwrap()
    expect(again.xpGained).toBe(0)
  })

  it('cada teste começa do estado inicial, sem sobra do anterior', async () => {
    const store = storeWithGoal()
    const { data: progress } = await store.dispatch(progressApi.endpoints.getProgress.initiate())
    expect(progress).toMatchObject({ xp: 1240, streakDays: 6, dailyGoal: { done: 0, target: 3 } })
    const { data: daily } = await store.dispatch(questionsApi.endpoints.getDailyQuestion.initiate())
    expect(daily!.status).toBe('NOT_STARTED')
  })

  it('errar marca tentada, não dá XP e devolve a certa com a explicação', async () => {
    const store = storeWithGoal()
    const slug = 'backend-junior-java-checked-exceptions'
    const result = await store
      .dispatch(
        questionsApi.endpoints.answerQuestion.initiate({
          slug,
          optionId: optionOf(slug, 'wrong').id,
        }),
      )
      .unwrap()
    expect(result).toMatchObject({
      correct: false,
      xpGained: 0,
      correctOptionId: optionOf(slug, 'correct').id,
      explanation: practiceProblem(slug).question!.explanation,
    })
    const { data: question } = await store.dispatch(
      questionsApi.endpoints.getQuestion.initiate(slug),
    )
    expect(question!.status).toBe('ATTEMPTED')
  })

  it('errar uma questão já resolvida mantém resolvida e dá 0 de XP', async () => {
    const store = storeWithGoal()
    const slug = 'backend-junior-sql-foreign-key'
    const result = await store
      .dispatch(
        questionsApi.endpoints.answerQuestion.initiate({
          slug,
          optionId: optionOf(slug, 'wrong').id,
        }),
      )
      .unwrap()
    expect(result).toMatchObject({ correct: false, xpGained: 0 })
    const { data: question } = await store.dispatch(
      questionsApi.endpoints.getQuestion.initiate(slug),
    )
    expect(question!.status).toBe('SOLVED')
  })

  it('responder refaz questões, progresso, trilha e conquistas', async () => {
    let trackCalls = 0
    server.use(
      http.get('/api/v1/career/track', () => {
        trackCalls += 1
        return HttpResponse.json(track)
      }),
    )
    const store = storeWithGoal()
    await store.dispatch(trackApi.endpoints.getTrack.initiate())
    await store.dispatch(progressApi.endpoints.getAchievements.initiate())
    const achievements = () => progressApi.endpoints.getAchievements.select()(store.getState())
    const before = achievements().requestId
    await store.dispatch(
      questionsApi.endpoints.answerQuestion.initiate({
        slug: DAILY,
        optionId: optionOf(DAILY, 'correct').id,
      }),
    )
    await waitFor(() => expect(trackCalls).toBe(2))
    await waitFor(() => expect(achievements().requestId).not.toBe(before))
  })

  it('salvar o objetivo refaz a lista de problemas', async () => {
    let calls = 0
    server.use(
      http.get('/api/v1/questions', () => {
        calls += 1
      }),
    )
    const store = storeWithGoal()
    await store.dispatch(questionsApi.endpoints.getQuestions.initiate({ page: 1, size: 10 }))
    expect(calls).toBe(1)
    await store.dispatch(
      careerApi.endpoints.saveCareerProfile.initiate({
        companies: ['ifood'],
        stack: 'react',
        seniority: 'PLENO',
      }),
    )
    await waitFor(() => expect(calls).toBe(2))
  })

  it('a questão do dia não muda depois de respondida', async () => {
    const store = storeWithGoal()
    await store.dispatch(
      questionsApi.endpoints.answerQuestion.initiate({
        slug: DAILY,
        optionId: optionOf(DAILY, 'correct').id,
      }),
    )
    const { data: again } = await store.dispatch(
      questionsApi.endpoints.getDailyQuestion.initiate(undefined, { forceRefetch: true }),
    )
    expect(again!.slug).toBe(DAILY)
    expect(again!.status).toBe('SOLVED')
  })

  it('questão desconhecida dá 404 com o detail do backend', async () => {
    const store = storeWithGoal()
    const result = await store.dispatch(questionsApi.endpoints.getQuestion.initiate('nao-existe'))
    expect(result.error).toMatchObject({
      status: 404,
      data: { detail: 'Questão não encontrada: nao-existe.' },
    })
  })

  it('alternativa de outra questão dá 422', async () => {
    const store = storeWithGoal()
    const result = await store.dispatch(
      questionsApi.endpoints.answerQuestion.initiate({
        slug: 'backend-junior-sql-index',
        optionId: optionOf(DAILY, 'correct').id,
      }),
    )
    expect(result.error).toMatchObject({ status: 422 })
  })
  it('o backend de prática do MSW imita a regra de nível', async () => {
    const store = storeWithGoal()
    const junior = await store.dispatch(
      questionsApi.endpoints.getQuestions.initiate({ page: 1, size: 50 }),
    )
    expect(junior.data!.totalItems).toBe(16)
    expect(junior.data!.items.every((item) => item.level === 'JUNIOR')).toBe(true)
    const hidden = await store.dispatch(
      questionsApi.endpoints.getQuestion.initiate('backend-pleno-composite-index-order'),
    )
    expect(hidden.error).toMatchObject({ status: 404 })

    setPracticeSeniority('PLENO')
    const pleno = await store.dispatch(
      questionsApi.endpoints.getQuestions.initiate({ page: 1, size: 50, level: 'PLENO' }),
    )
    expect(pleno.data!.items.map((item) => item.slug)).toEqual([
      'backend-pleno-transaction-isolation',
      'backend-pleno-composite-index-order',
    ])
    const open = await store.dispatch(
      questionsApi.endpoints.getQuestion.initiate('backend-pleno-composite-index-order', {
        forceRefetch: true,
      }),
    )
    expect(open.data).toMatchObject({
      slug: 'backend-pleno-composite-index-order',
      level: 'PLENO',
    })
  })
})
