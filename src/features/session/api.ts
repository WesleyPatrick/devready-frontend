import { api } from '@/lib/api'
import type { Submission, SubmissionTicket } from '@/features/challenge/types'
import type {
  AnswerBody,
  Session,
  SessionAnswer,
  SessionCodeBody,
  SessionResult,
  SessionSummary,
} from './types'

const CURRENT = { type: 'Session' as const, id: 'CURRENT' }
const LIST = { type: 'Session' as const, id: 'LIST' }

export const sessionApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCurrentSession: build.query<Session, void>({
      query: () => '/api/v1/sessions/current',
      providesTags: [CURRENT],
    }),
    getSessions: build.query<SessionSummary[], void>({
      query: () => '/api/v1/sessions',
      providesTags: [LIST],
    }),
    getSession: build.query<Session, string>({
      query: (id) => `/api/v1/sessions/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'Session', id }],
    }),
    getSessionResult: build.query<SessionResult, string>({
      query: (id) => `/api/v1/sessions/${encodeURIComponent(id)}/result`,
      providesTags: (_result, _error, id) => [{ type: 'Session', id: `${id}:result` }],
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(
            api.util.invalidateTags([
              'Progress',
              'Question',
              'Challenge',
              'Track',
              'Achievement',
              LIST,
              CURRENT,
            ]),
          )
        } catch {}
      },
    }),
    getSessionSubmission: build.query<Submission, string>({
      query: (id) => `/api/v1/submissions/${encodeURIComponent(id)}`,
    }),
    startLesson: build.mutation<Session, { competency: string }>({
      query: (body) => ({ url: '/api/v1/sessions/lessons', method: 'POST', body }),
      invalidatesTags: [CURRENT, LIST, 'Session'],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(sessionApi.util.upsertQueryData('getSession', data.id, data))
        } catch {}
      },
    }),
    startSimulation: build.mutation<Session, { area: string; level: string }>({
      query: (body) => ({ url: '/api/v1/sessions/simulations', method: 'POST', body }),
      invalidatesTags: [CURRENT, LIST, 'Session', 'Question', 'Challenge'],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(sessionApi.util.upsertQueryData('getSession', data.id, data))
        } catch {}
      },
    }),
    answerSessionQuestion: build.mutation<SessionAnswer, AnswerBody>({
      query: ({ sessionId, position, optionId }) => ({
        url: `/api/v1/sessions/${encodeURIComponent(sessionId)}/questions/${position}`,
        method: 'PUT',
        body: { optionId },
      }),
      async onQueryStarted({ sessionId, position }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            sessionApi.util.updateQueryData('getSession', sessionId, (draft) => {
              const question = draft.questions.find((q) => q.position === position)
              if (question) {
                question.chosenOptionId = data.chosenOptionId
                question.correct = data.correct
                question.correctOptionId = data.correctOptionId
                question.explanation = data.explanation
              }
              draft.status = data.sessionStatus
            }),
          )
          if (data.correct !== undefined) {
            dispatch(api.util.invalidateTags(['Question', 'Progress', 'Track', 'Achievement']))
          }
          if (data.sessionStatus !== 'IN_PROGRESS')
            dispatch(api.util.invalidateTags([LIST, CURRENT]))
        } catch {}
      },
    }),
    runSessionCode: build.mutation<SubmissionTicket, SessionCodeBody>({
      query: ({ sessionId, position, language, sourceCode }) => ({
        url: `/api/v1/sessions/${encodeURIComponent(sessionId)}/challenges/${position}/runs`,
        method: 'POST',
        body: { language, sourceCode },
      }),
    }),
    submitSessionCode: build.mutation<SubmissionTicket, SessionCodeBody>({
      query: ({ sessionId, position, language, sourceCode }) => ({
        url: `/api/v1/sessions/${encodeURIComponent(sessionId)}/challenges/${position}/submissions`,
        method: 'POST',
        body: { language, sourceCode },
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [{ type: 'Session', id: sessionId }],
    }),
    finishSession: build.mutation<{ status: Session['status'] }, string>({
      query: (id) => ({
        url: `/api/v1/sessions/${encodeURIComponent(id)}/finish`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        'Progress',
        'Question',
        'Challenge',
        'Track',
        'Achievement',
        { type: 'Session', id },
        LIST,
        CURRENT,
      ],
    }),
  }),
})

export const {
  useGetCurrentSessionQuery,
  useGetSessionsQuery,
  useGetSessionQuery,
  useGetSessionResultQuery,
  useGetSessionSubmissionQuery,
  useStartLessonMutation,
  useStartSimulationMutation,
  useAnswerSessionQuestionMutation,
  useRunSessionCodeMutation,
  useSubmitSessionCodeMutation,
  useFinishSessionMutation,
} = sessionApi
