import { api } from '@/lib/api'
import type { CareerOptions, CareerProfile, SaveCareerProfileBody } from './types'

export const careerApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCareerOptions: build.query<CareerOptions, void>({
      query: () => '/api/v1/career/options',
    }),
    getCareerProfile: build.query<CareerProfile, void>({
      query: () => '/api/v1/career/profile',
      providesTags: ['CareerProfile'],
    }),
    saveCareerProfile: build.mutation<CareerProfile, SaveCareerProfileBody>({
      query: (body) => ({ url: '/api/v1/career/profile', method: 'PUT', body }),
      invalidatesTags: ['Track', 'Question', 'Challenge'],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            careerApi.util.upsertQueryEntries([
              { endpointName: 'getCareerProfile', arg: undefined, value: data },
            ]),
          )
        } catch {}
      },
    }),
  }),
})

export const { useGetCareerOptionsQuery, useGetCareerProfileQuery, useSaveCareerProfileMutation } =
  careerApi
