export type Role = 'CANDIDATE' | 'ADMIN'
export type SocialProvider = 'GOOGLE' | 'GITHUB'

export type CurrentUser = {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  role: Role
  hasPassword: boolean
  providers: SocialProvider[]
  mustChangePassword: boolean
}

export type AuthProvidersResponse = { providers: SocialProvider[] }

export type AuthTokensResponse = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
  user: CurrentUser
}
