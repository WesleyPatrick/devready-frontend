import { waitFor } from '@testing-library/react'
import { progressApi } from '@/features/progress/api'
import { trackApi } from '@/features/track/api'
import { stepSubmissions } from '@/test/challenge'
import { storeWithGoal } from '@/test/render'
import { challengeApi } from './api'

describe('challengeApi', () => {
  it('lê o desafio com a versão de cada linguagem, os casos visíveis e quantos são ocultos', async () => {
    const store = storeWithGoal()

    const challenge = await store
      .dispatch(challengeApi.endpoints.getChallenge.initiate('two-sum'))
      .unwrap()

    expect(challenge.languages.map((l) => l.runtime)).toEqual(['Java 13', 'Python 3.8', 'Node 12'])
    expect(challenge.visibleCases).toHaveLength(2)
    expect(challenge.hiddenCaseCount).toBe(4)
    expect(challenge.approachSummary).toBeNull()
  })

  it('quando o envio chega ao fim, o progresso é lido de novo', async () => {
    const store = storeWithGoal()
    const progress = store.dispatch(progressApi.endpoints.getProgress.initiate())
    await progress
    const before = progressApi.endpoints.getProgress.select()(store.getState()).requestId

    const ticket = await store
      .dispatch(
        challengeApi.endpoints.submitCode.initiate({
          slug: 'two-sum',
          language: 'JAVA',
          sourceCode: 'class Solution {}',
        }),
      )
      .unwrap()
    expect(ticket.status).toBe('QUEUED')
    const poll = store.dispatch(
      challengeApi.endpoints.getSubmission.initiate(ticket.id, {
        subscriptionOptions: { pollingInterval: 20 },
      }),
    )

    await waitFor(() =>
      expect(
        challengeApi.endpoints.getSubmission.select(ticket.id)(store.getState()).data?.status,
      ).toBe('PASSED'),
    )
    await waitFor(() =>
      expect(progressApi.endpoints.getProgress.select()(store.getState()).data?.xp).toBe(1280),
    )
    expect(progressApi.endpoints.getProgress.select()(store.getState()).requestId).not.toBe(before)
    poll.unsubscribe()
    progress.unsubscribe()
  })

  it('quando o envio chega ao fim, a trilha é lida de novo', async () => {
    const store = storeWithGoal()
    const track = store.dispatch(trackApi.endpoints.getTrack.initiate())
    await track
    const before = trackApi.endpoints.getTrack.select()(store.getState()).requestId
    const ticket = await store
      .dispatch(
        challengeApi.endpoints.submitCode.initiate({
          slug: 'two-sum',
          language: 'JAVA',
          sourceCode: 'class Solution {}',
        }),
      )
      .unwrap()
    const poll = store.dispatch(
      challengeApi.endpoints.getSubmission.initiate(ticket.id, {
        subscriptionOptions: { pollingInterval: 20 },
      }),
    )

    await waitFor(() =>
      expect(trackApi.endpoints.getTrack.select()(store.getState()).requestId).not.toBe(before),
    )
    poll.unsubscribe()
    track.unsubscribe()
  })

  it('abrir um envio antigo no editor não lê o progresso de novo', async () => {
    const store = storeWithGoal()
    const progress = store.dispatch(progressApi.endpoints.getProgress.initiate())
    await progress
    const ticket = await store
      .dispatch(
        challengeApi.endpoints.submitCode.initiate({
          slug: 'two-sum',
          language: 'PYTHON',
          sourceCode: 'class Solution: pass',
        }),
      )
      .unwrap()
    stepSubmissions()
    stepSubmissions()
    const before = progressApi.endpoints.getProgress.select()(store.getState()).requestId

    const loaded = await store
      .dispatch(challengeApi.endpoints.getSubmissionCode.initiate(ticket.id))
      .unwrap()

    expect(loaded.sourceCode).toBe('class Solution: pass')
    expect(loaded.status).toBe('PASSED')
    expect(progressApi.endpoints.getProgress.select()(store.getState()).requestId).toBe(before)
    progress.unsubscribe()
  })
})
