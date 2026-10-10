import { questionsApi } from '@/features/questions/api'
import { isoDate } from '@/lib/format'
import { optionOf } from '@/test/practice'
import { storeWithGoal } from '@/test/render'
import { progressApi } from './api'

const DAILY = 'backend-junior-java-equals-hashcode'

it('o progresso vem da API: cinco semanas até hoje, sequência até ontem e meta zerada', async () => {
  const store = storeWithGoal()
  const { data } = await store.dispatch(progressApi.endpoints.getProgress.initiate())
  expect(data!.activity).toHaveLength(35)
  expect(data!.activity.at(-1)).toEqual({ date: isoDate(new Date()), count: 0 })
  expect(data!.streakDays).toBe(6)
  expect(data!.dailyGoal).toEqual({ done: 0, target: 3 })
})

it('as conquistas vêm da API: dez, três desbloqueadas antes de hoje, na ordem do catálogo', async () => {
  const store = storeWithGoal()
  const { data } = await store.dispatch(progressApi.endpoints.getAchievements.initiate())
  expect(data).toHaveLength(10)
  expect(data![0].slug).toBe('primeira-questao')
  expect(data!.filter((a) => a.unlockedAt !== null).map((a) => a.slug)).toEqual([
    'primeira-questao',
    'sequencia-3',
    'mil-xp',
  ])
})

it('a primeira resposta do dia sobe a sequência para 7 e desbloqueia "Uma semana seguida"', async () => {
  const store = storeWithGoal()
  const { data: answer } = await store.dispatch(
    questionsApi.endpoints.answerQuestion.initiate({
      slug: DAILY,
      optionId: optionOf(DAILY, 'correct').id,
    }),
  )
  expect(answer!.newAchievements).toEqual(['sequencia-7'])
  const { data } = await store.dispatch(progressApi.endpoints.getAchievements.initiate())
  expect(data!.find((a) => a.slug === 'sequencia-7')!.unlockedAt).not.toBeNull()
})
