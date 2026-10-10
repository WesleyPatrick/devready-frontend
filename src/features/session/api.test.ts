import { waitFor } from '@testing-library/react'
import { progressApi } from '@/features/progress/api'
import { questionsApi } from '@/features/questions/api'
import { storeWithGoal } from '@/test/render'
import { failSession, openSimulation, sessionSnapshot, SIMULATION_QUESTIONS } from '@/test/session'
import { optionOf } from '@/test/practice'
import { sessionApi } from './api'
import { openSessionIdOf } from './errors'

describe('sessionApi', () => {
  it('começa a simulação, e a segunda devolve 409 com o id da aberta', async () => {
    const store = storeWithGoal()
    const { data: session } = await store.dispatch(
      sessionApi.endpoints.startSimulation.initiate({ area: 'backend', level: 'JUNIOR' }),
    )
    expect(session!.questions).toHaveLength(8)
    expect(session!.challenges).toHaveLength(2)
    expect(session!.questions[0].correct).toBeUndefined()

    const second = await store.dispatch(
      sessionApi.endpoints.startSimulation.initiate({ area: 'backend', level: 'JUNIOR' }),
    )
    expect(openSessionIdOf(second.error)).toBe(session!.id)
  })

  it('responder na simulação grava a escolha no cache da sessão, sem gabarito', async () => {
    const store = storeWithGoal()
    const session = openSimulation()
    await store.dispatch(sessionApi.endpoints.getSession.initiate(session.id))
    const option = optionOf(SIMULATION_QUESTIONS[0], 'correct').id

    const { data } = await store.dispatch(
      sessionApi.endpoints.answerSessionQuestion.initiate({
        sessionId: session.id,
        position: 1,
        optionId: option,
      }),
    )

    expect(data!.correct).toBeUndefined()
    const cached = sessionApi.endpoints.getSession.select(session.id)(store.getState()).data!
    expect(cached.questions[0].chosenOptionId).toBe(option)
  })

  it('a resposta da lição refaz progresso, questões e conquistas', async () => {
    const store = storeWithGoal()
    await store.dispatch(progressApi.endpoints.getAchievements.initiate())
    await store.dispatch(progressApi.endpoints.getProgress.initiate())
    const before = progressApi.endpoints.getAchievements.select()(store.getState()).requestId
    const { data: lesson } = await store.dispatch(
      sessionApi.endpoints.startLesson.initiate({ competency: 'sql-e-modelagem-de-dados' }),
    )

    const { data } = await store.dispatch(
      sessionApi.endpoints.answerSessionQuestion.initiate({
        sessionId: lesson!.id,
        position: 1,
        optionId: optionOf(lesson!.questions[0].slug, 'correct').id,
      }),
    )

    expect(data!.correct).toBe(true)
    expect(data!.newAchievements).toEqual(['sequencia-7'])
    await waitFor(() =>
      expect(progressApi.endpoints.getAchievements.select()(store.getState()).requestId).not.toBe(
        before,
      ),
    )
  })

  it('o resultado refaz progresso, trilha, questões e conquistas', async () => {
    const store = storeWithGoal()
    const session = openSimulation()
    await store.dispatch(questionsApi.endpoints.getQuestion.initiate(SIMULATION_QUESTIONS[0]))
    const before = questionsApi.endpoints.getQuestion.select(SIMULATION_QUESTIONS[0])(
      store.getState(),
    ).requestId
    await store.dispatch(
      sessionApi.endpoints.answerSessionQuestion.initiate({
        sessionId: session.id,
        position: 1,
        optionId: optionOf(SIMULATION_QUESTIONS[0], 'correct').id,
      }),
    )
    await store.dispatch(sessionApi.endpoints.finishSession.initiate(session.id))

    const { data } = await store.dispatch(
      sessionApi.endpoints.getSessionResult.initiate(session.id),
    )

    expect(data!.newAchievements).toContain('primeira-simulacao')
    await waitFor(() =>
      expect(
        questionsApi.endpoints.getQuestion.select(SIMULATION_QUESTIONS[0])(store.getState())
          .requestId,
      ).not.toBe(before),
    )
  })

  it('a simulação encerrada sem nada respondido dá 0 XP e nenhuma conquista', async () => {
    const store = storeWithGoal()
    const session = openSimulation()
    await store.dispatch(sessionApi.endpoints.finishSession.initiate(session.id))

    const { data } = await store.dispatch(
      sessionApi.endpoints.getSessionResult.initiate(session.id),
    )

    expect(data!.xpAwarded).toBe(0)
    expect(data!.newAchievements).toEqual([])
  })

  describe('envio selado, como o backend', () => {
    async function sendAndFinish(store: ReturnType<typeof storeWithGoal>, sessionId: string) {
      const { data: ticket } = await store.dispatch(
        sessionApi.endpoints.submitSessionCode.initiate({
          sessionId,
          position: 1,
          language: 'JAVA',
          sourceCode: 'class Solution {}',
        }),
      )
      for (let i = 0; i < 3; i += 1) {
        await store.dispatch(
          sessionApi.endpoints.getSessionSubmission.initiate(ticket!.id, { forceRefetch: true }),
        )
      }
      return store.dispatch(
        sessionApi.endpoints.getSessionSubmission.initiate(ticket!.id, { forceRefetch: true }),
      )
    }

    it('com a prova aberta, sela: sem casos, sem saída de compilação nem mensagem de erro', async () => {
      const store = storeWithGoal()
      const session = openSimulation()
      const { data } = await sendAndFinish(store, session.id)
      expect(data).toMatchObject({
        sealed: true,
        cases: [],
        compileOutput: null,
        errorMessage: null,
      })
      expect(data!.passedCount).toBeGreaterThan(0)
    })

    it('com a sessão entregue, ainda sela', async () => {
      const store = storeWithGoal()
      const session = openSimulation()
      const { data: ticket } = await store.dispatch(
        sessionApi.endpoints.submitSessionCode.initiate({
          sessionId: session.id,
          position: 1,
          language: 'JAVA',
          sourceCode: 'class Solution {}',
        }),
      )
      await store.dispatch(sessionApi.endpoints.finishSession.initiate(session.id))
      const { data } = await store.dispatch(
        sessionApi.endpoints.getSessionSubmission.initiate(ticket!.id, { forceRefetch: true }),
      )
      expect(data!.sealed).toBe(true)
    })

    it('com a sessão falha, não sela', async () => {
      const store = storeWithGoal()
      const session = openSimulation()
      const { data: ticket } = await store.dispatch(
        sessionApi.endpoints.submitSessionCode.initiate({
          sessionId: session.id,
          position: 1,
          language: 'JAVA',
          sourceCode: 'class Solution {}',
        }),
      )
      failSession(session.id)
      const { data } = await store.dispatch(
        sessionApi.endpoints.getSessionSubmission.initiate(ticket!.id, { forceRefetch: true }),
      )
      expect(data!.sealed).toBe(false)
    })

    it('o melhor envio já aparece na sessão durante a prova', async () => {
      const store = storeWithGoal()
      const session = openSimulation()
      expect(sessionSnapshot(session.id).challenges[0].bestSubmissionId).toBeNull()
      const { data } = await sendAndFinish(store, session.id)
      expect(data!.status).toBe('PASSED')
      expect(sessionSnapshot(session.id).challenges[0].bestSubmissionId).toBe(data!.id)
      expect(sessionSnapshot(session.id).challenges[1].bestSubmissionId).toBeNull()
    })
  })
})
