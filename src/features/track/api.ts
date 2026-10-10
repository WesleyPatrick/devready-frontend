import { api } from '@/lib/api'
import type { CompetencyDetail, Track } from './types'

export const trackApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTrack: build.query<Track, void>({
      query: () => '/api/v1/career/track',
      providesTags: ['Track'],
    }),
    getCompetency: build.query<CompetencyDetail, string>({
      query: (slug) => `/api/v1/career/track/competencies/${encodeURIComponent(slug)}`,
      providesTags: ['Track'],
    }),
  }),
})

export const { useGetTrackQuery, useGetCompetencyQuery } = trackApi
