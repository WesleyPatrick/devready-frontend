import { api } from '@/lib/api'
import type { Level } from '@/lib/learning'

export type { Level }

export type Area = {
  slug: string
  name: string
  questionCount: number
  challengeCount: number
  durationMinutes: number
  objectiveWeight: number
  levels: Level[]
}

export const catalogApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAreas: build.query<Area[], void>({
      query: () => '/api/v1/areas',
    }),
  }),
})

export const { useGetAreasQuery } = catalogApi
