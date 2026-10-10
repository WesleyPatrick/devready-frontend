import { http, HttpResponse } from 'msw'
import type { UpdateProfileBody } from '@/features/auth/api'
import type { SaveCareerProfileBody } from '@/features/career/types'
import type { Track } from '@/features/track/types'
import {
  areas,
  candidate,
  careerOptions,
  careerProfile,
  competencyDetail,
  track,
  tokens,
} from './fixtures'
import { adminHandlers } from './admin'
import { achievementHandlers } from './achievements'
import { challengeHandlers } from './challenge'
import { practiceHandlers } from './practice'
import { problem } from './problem'
import { sessionHandlers } from './session'

export { problem }

export function trackHandlers(data: Track = track) {
  return [
    http.get('/api/v1/career/track', ({ request }) =>
      request.headers.get('Authorization')
        ? HttpResponse.json(data)
        : problem(401, 'Não autenticado', 'Token ausente.'),
    ),
    http.get('/api/v1/career/track/competencies/:slug', ({ request, params }) => {
      if (!request.headers.get('Authorization'))
        return problem(401, 'Não autenticado', 'Token ausente.')
      const detail = competencyDetail(String(params.slug), data)
      return detail
        ? HttpResponse.json(detail)
        : problem(404, 'Não encontrado', `Competência fora da sua trilha: ${params.slug}.`)
    }),
  ]
}

export const handlers = [
  http.get('/actuator/health', () => HttpResponse.json({ status: 'UP' })),
  http.post('/api/v1/auth/register', () => HttpResponse.json(tokens, { status: 201 })),
  http.post('/api/v1/auth/login', () => HttpResponse.json(tokens)),
  http.post('/api/v1/auth/refresh', ({ request }) =>
    request.headers.get('Authorization')
      ? problem(401, 'Não autenticado', 'Jwt expired.')
      : HttpResponse.json({ ...tokens, accessToken: 'access-2', refreshToken: 'refresh-2' }),
  ),
  http.post('/api/v1/auth/logout', ({ request }) =>
    request.headers.get('Authorization')
      ? problem(401, 'Não autenticado', 'Jwt expired.')
      : new HttpResponse(null, { status: 204 }),
  ),
  http.post('/api/v1/auth/logout-all', () => new HttpResponse(null, { status: 204 })),
  http.post('/api/v1/auth/exchange', () => HttpResponse.json(tokens)),
  http.get('/api/v1/auth/providers', () => HttpResponse.json({ providers: ['GOOGLE', 'GITHUB'] })),
  http.get('/api/v1/areas', ({ request }) =>
    request.headers.get('Authorization')
      ? HttpResponse.json(areas)
      : problem(401, 'Não autenticado', 'Token ausente.'),
  ),
  http.patch('/api/v1/me', async ({ request }) => {
    const body = (await request.json()) as UpdateProfileBody
    if (body.avatarUrl && !body.avatarUrl.startsWith('https://'))
      return problem(422, 'Dados inválidos', 'Confira os campos.', [
        { field: 'avatarUrl', message: 'A URL do avatar precisa começar com https://.' },
      ])
    if (body.newPassword && body.currentPassword === 'errada')
      return problem(422, 'Dados inválidos', 'Confira os campos.', [
        { field: 'currentPassword', message: 'Senha atual incorreta.' },
      ])
    return HttpResponse.json({
      ...candidate,
      displayName: body.displayName,
      avatarUrl: body.avatarUrl,
      hasPassword: candidate.hasPassword || !!body.newPassword,
    })
  }),
  http.get('/api/v1/career/options', () => HttpResponse.json(careerOptions)),
  http.get('/api/v1/career/profile', ({ request }) =>
    request.headers.get('Authorization')
      ? HttpResponse.json(careerProfile)
      : problem(401, 'Não autenticado', 'Token ausente.'),
  ),
  http.put('/api/v1/career/profile', async ({ request }) => {
    if (!request.headers.get('Authorization'))
      return problem(401, 'Não autenticado', 'Token ausente.')
    const body = (await request.json()) as SaveCareerProfileBody
    const bySlug = new Map(careerOptions.companies.map((c) => [c.slug, c]))
    return HttpResponse.json({
      companies: body.companies.map((slug) => bySlug.get(slug)),
      stack: careerOptions.stacks.find((s) => s.slug === body.stack),
      seniority: body.seniority,
    })
  }),
  ...adminHandlers(),
  ...trackHandlers(),
  ...practiceHandlers(),
  ...achievementHandlers(),
  ...sessionHandlers(),
  ...challengeHandlers(),
]
