import { api } from '@/lib/api'
import type { Achievement, Progress } from './types'

export const progressApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProgress: build.query<Progress, void>({
      query: () => '/api/v1/me/progress',
      providesTags: ['Progress'],
    }),
    getAchievements: build.query<Achievement[], void>({
      query: () => '/api/v1/me/achievements',
      providesTags: ['Achievement'],
    }),
  }),
})

export const { useGetProgressQuery, useGetAchievementsQuery } = progressApi
