import { http, HttpResponse } from 'msw'
import type { AdminUser, AdminUserPage, ChangeUserAccessBody } from '@/features/admin/types'
import { admin } from './fixtures'
import { problem } from './problem'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

export const ELIS_ID = 'a0000000-0000-4000-8000-000000000001'
export const DAVI_ID = 'a0000000-0000-4000-8000-000000000002'
export const CARLA_ID = 'a0000000-0000-4000-8000-000000000003'
export const BRUNO_ID = 'a0000000-0000-4000-8000-000000000004'
export const MISSING_ID = 'c0000000-0000-4000-8000-000000000000'

function initial(): AdminUser[] {
  const named: AdminUser[] = [
    {
      id: ELIS_ID,
      displayName: 'Elis Teste',
      email: 'elis-sessao@example.com',
      avatarUrl: null,
      role: 'CANDIDATE',
      active: true,
      hasPassword: true,
      socialProviders: ['GOOGLE'],
      createdAt: ago(2 * HOUR),
    },
    {
      id: DAVI_ID,
      displayName: 'Davi Desafio',
      email: 'davi-desafio@example.com',
      avatarUrl: null,
      role: 'CANDIDATE',
      active: true,
      hasPassword: false,
      socialProviders: ['GITHUB'],
      createdAt: ago(DAY),
    },
    {
      id: CARLA_ID,
      displayName: 'Carla Desafio',
      email: 'carla-desafio@example.com',
      avatarUrl: null,
      role: 'CANDIDATE',
      active: false,
      hasPassword: true,
      socialProviders: [],
      createdAt: ago(3 * DAY),
    },
    {
      id: BRUNO_ID,
      displayName: 'Bruno Admin',
      email: 'bruno@example.com',
      avatarUrl: null,
      role: 'ADMIN',
      active: true,
      hasPassword: true,
      socialProviders: [],
      createdAt: ago(10 * DAY),
    },
  ]
  const people = Array.from({ length: 19 }, (_, index): AdminUser => {
    const n = String(index + 1).padStart(2, '0')
    return {
      id: `b0000000-0000-4000-8000-0000000000${n}`,
      displayName: `Pessoa ${n}`,
      email: `pessoa${n}@example.com`,
      avatarUrl: null,
      role: 'CANDIDATE',
      active: true,
      hasPassword: true,
      socialProviders: [],
      createdAt: ago((20 + index) * DAY),
    }
  })
  const me: AdminUser = {
    id: admin.id,
    displayName: admin.displayName,
    email: admin.email,
    avatarUrl: null,
    role: 'ADMIN',
    active: true,
    hasPassword: true,
    socialProviders: [],
    createdAt: ago(120 * DAY),
  }
  return [...named, ...people, me]
}

let users = initial()
let revoked: string[] = []
let mustChange = new Set<string>()
let issued: string[] = []

export function resetAdminUsers() {
  users = initial()
  revoked = []
  mustChange = new Set()
  issued = []
}

export function adminUser(id: string) {
  const user = users.find((candidate) => candidate.id === id)
  if (!user) throw new Error(`conta desconhecida no MSW: ${id}`)
  return user
}

export function revokedSessions() {
  return [...revoked]
}

export function mustChangePassword(id: string) {
  return mustChange.has(id)
}

export function issuedPasswords() {
  return [...issued]
}

const nextTemporaryPassword = () => `Provisoria${String(issued.length + 1).padStart(6, '0')}`

const unauthorized = () => problem(401, 'Não autenticado', 'Token ausente.')

function matches(user: AdminUser, params: URLSearchParams) {
  const q = params.get('q')?.trim().toLowerCase()
  const role = params.get('role')
  const active = params.get('active')
  return (
    (!q || user.displayName.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)) &&
    (!role || user.role === role) &&
    (active === null || String(user.active) === active)
  )
}

const isActiveAdmin = (user: AdminUser) => user.role === 'ADMIN' && user.active
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function notAnActiveAdmin() {
  const me = users.find((user) => user.id === admin.id)
  return !me || !isActiveAdmin(me)
}

const forbidden = () =>
  problem(403, 'Sem permissão', 'Você não tem mais acesso à gestão de usuários.')

export function adminHandlers() {
  return [
    http.get('/api/v1/admin/users', ({ request }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      if (notAnActiveAdmin()) return forbidden()
      const params = new URL(request.url).searchParams
      const matching = users
        .filter((user) => matches(user, params))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const size = Math.min(50, Math.max(1, Number(params.get('size')) || 20))
      const totalPages = Math.max(1, Math.ceil(matching.length / size))
      const page = Math.min(totalPages, Math.max(1, Number(params.get('page')) || 1))
      const body: AdminUserPage = {
        items: matching.slice((page - 1) * size, page * size),
        page,
        totalPages,
        totalItems: matching.length,
      }
      return HttpResponse.json(body)
    }),
    http.patch('/api/v1/admin/users/:id', async ({ request, params }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const id = String(params.id)
      if (!UUID.test(id))
        return problem(400, 'Requisição inválida', 'O parâmetro id está em formato inválido.')
      const body = (await request.json()) as ChangeUserAccessBody
      if (body.active == null && body.role == null)
        return problem(
          400,
          'Requisição inválida',
          'Informe o que mudar: a situação da conta, o papel ou os dois.',
        )
      if (id === admin.id)
        return problem(
          422,
          'Dados inválidos',
          'Você não pode alterar a sua própria conta por aqui.',
        )
      if (notAnActiveAdmin()) return forbidden()
      const target = users.find((user) => user.id === id)
      if (!target) return problem(404, 'Não encontrado', 'Usuário não encontrado.')
      const next: AdminUser = {
        ...target,
        active: body.active ?? target.active,
        role: body.role ?? target.role,
      }
      if (isActiveAdmin(target) && !isActiveAdmin(next) && users.filter(isActiveAdmin).length <= 1)
        return problem(422, 'Dados inválidos', 'O sistema precisa de ao menos um admin ativo.')
      if (target.active && !next.active) revoked.push(id)
      Object.assign(target, next)
      return HttpResponse.json({ ...target })
    }),
    http.post('/api/v1/admin/users/:id/password-reset', ({ request, params }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const id = String(params.id)
      if (!UUID.test(id))
        return problem(400, 'Requisição inválida', 'O parâmetro id está em formato inválido.')
      if (id === admin.id)
        return problem(
          422,
          'Dados inválidos',
          'Você não pode alterar a sua própria conta por aqui.',
        )
      if (notAnActiveAdmin()) return forbidden()
      const target = users.find((user) => user.id === id)
      if (!target) return problem(404, 'Não encontrado', 'Usuário não encontrado.')
      const temporaryPassword = nextTemporaryPassword()
      issued.push(temporaryPassword)
      target.hasPassword = true
      mustChange.add(id)
      revoked.push(id)
      return HttpResponse.json({ temporaryPassword }, { headers: { 'Cache-Control': 'no-store' } })
    }),
  ]
}
