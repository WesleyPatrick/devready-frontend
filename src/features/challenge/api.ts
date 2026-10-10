import type { RootState } from '@/app/store'
import { api } from '@/lib/api'
import { isFinal } from './status'
import type { Challenge, CodeBody, Submission, SubmissionSummary, SubmissionTicket } from './types'

export const challengeApi = api.injectEndpoints({
  endpoints: (build) => ({
    getChallenge: build.query<Challenge, string>({
      query: (slug) => `/api/v1/challenges/${encodeURIComponent(slug)}`,
      providesTags: (_result, _error, slug) => [{ type: 'Challenge', id: slug }],
    }),
    getChallengeSubmissions: build.query<SubmissionSummary[], string>({
      query: (slug) => `/api/v1/challenges/${encodeURIComponent(slug)}/submissions`,
      providesTags: (_result, _error, slug) => [{ type: 'Submission', id: slug }],
    }),
    getSubmission: build.query<Submission, string>({
      query: (id) => `/api/v1/submissions/${encodeURIComponent(id)}`,
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const before = challengeApi.endpoints.getSubmission.select(id)(getState() as RootState).data
        try {
          const { data } = await queryFulfilled
          if (isFinal(data.status) && (!before || !isFinal(before.status))) {
            dispatch(
              api.util.invalidateTags([
                'Question',
                'Progress',
                'Track',
                'Achievement',
                { type: 'Challenge', id: data.challengeSlug },
                { type: 'Submission', id: data.challengeSlug },
              ]),
            )
          }
        } catch {}
      },
    }),
    getSubmissionCode: build.query<Submission, string>({
      query: (id) => `/api/v1/submissions/${encodeURIComponent(id)}`,
    }),
    runCode: build.mutation<SubmissionTicket, CodeBody>({
      query: ({ slug, language, sourceCode }) => ({
        url: `/api/v1/challenges/${encodeURIComponent(slug)}/runs`,
        method: 'POST',
        body: { language, sourceCode },
      }),
    }),
    submitCode: build.mutation<SubmissionTicket, CodeBody>({
      query: ({ slug, language, sourceCode }) => ({
        url: `/api/v1/challenges/${encodeURIComponent(slug)}/submissions`,
        method: 'POST',
        body: { language, sourceCode },
      }),
    }),
  }),
})

export const {
  useGetChallengeQuery,
  useGetChallengeSubmissionsQuery,
  useGetSubmissionQuery,
  useLazyGetSubmissionCodeQuery,
  useRunCodeMutation,
  useSubmitCodeMutation,
} = challengeApi
