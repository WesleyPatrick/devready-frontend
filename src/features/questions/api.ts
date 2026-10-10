import { api } from '@/lib/api'
import type { AnswerBody, AnswerResult, Question, QuestionFilters, QuestionPage } from './types'

export const questionsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getQuestions: build.query<QuestionPage, QuestionFilters>({
      query: (filters) => ({ url: '/api/v1/questions', params: filters }),
      providesTags: ['Question'],
    }),
    getQuestion: build.query<Question, string>({
      query: (slug) => `/api/v1/questions/${encodeURIComponent(slug)}`,
      providesTags: ['Question'],
    }),
    getDailyQuestion: build.query<Question, void>({
      query: () => '/api/v1/questions/daily',
      providesTags: ['Question'],
    }),
    answerQuestion: build.mutation<AnswerResult, AnswerBody>({
      query: ({ slug, optionId }) => ({
        url: `/api/v1/questions/${encodeURIComponent(slug)}/answer`,
        method: 'POST',
        body: { optionId },
      }),
      invalidatesTags: ['Question', 'Progress', 'Track', 'Achievement'],
    }),
  }),
})

export const {
  useGetQuestionsQuery,
  useGetQuestionQuery,
  useGetDailyQuestionQuery,
  useAnswerQuestionMutation,
} = questionsApi
