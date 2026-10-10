import { api } from '@/lib/api'

export type HealthResponse = { status: 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN' }

export const healthApi = api.injectEndpoints({
  endpoints: (build) => ({
    getHealth: build.query<HealthResponse, void>({
      query: () => '/actuator/health',
    }),
  }),
})

export const { useGetHealthQuery } = healthApi
