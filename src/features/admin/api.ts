import { api } from '@/lib/api'
import type {
  AdminUser,
  AdminUserFilters,
  AdminUserPage,
  ChangeUserAccessArgs,
  TemporaryPasswordResponse,
} from './types'

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAdminUsers: build.query<AdminUserPage, AdminUserFilters>({
      query: (filters) => ({ url: '/api/v1/admin/users', params: filters }),
      providesTags: ['AdminUser'],
    }),
    changeUserAccess: build.mutation<AdminUser, ChangeUserAccessArgs>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/users/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminUser'],
    }),
    resetUserPassword: build.mutation<TemporaryPasswordResponse, string>({
      query: (id) => ({
        url: `/api/v1/admin/users/${encodeURIComponent(id)}/password-reset`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminUser'],
    }),
  }),
})

export const { useGetAdminUsersQuery, useChangeUserAccessMutation } = adminApi
