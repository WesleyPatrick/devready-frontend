import type { Role, SocialProvider } from '@/features/auth/types'

export type AdminUser = {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  role: Role
  active: boolean
  hasPassword: boolean
  socialProviders: SocialProvider[]
  createdAt: string
}

export type AdminUserPage = {
  items: AdminUser[]
  page: number
  totalPages: number
  totalItems: number
}

export type AdminUserFilters = {
  page: number
  size: number
  q?: string
  role?: Role
  active?: boolean
}

export type ChangeUserAccessBody = { active?: boolean; role?: Role }

export type ChangeUserAccessArgs = { id: string; body: ChangeUserAccessBody }

export type AccessAction = 'deactivate' | 'activate' | 'promote' | 'demote'

export type RowAction = AccessAction | 'resetPassword'

export type TemporaryPasswordResponse = { temporaryPassword: string }
