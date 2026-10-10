import { admin, candidate } from '@/test/fixtures'
import { homeFor } from './paths'

describe('homeFor', () => {
  it('o admin começa na gestão de usuários', () => {
    expect(homeFor(admin)).toBe('/admin/users')
  })

  it('o candidato começa na trilha (sem objetivo, o guard da carreira leva ao onboarding)', () => {
    expect(homeFor(candidate)).toBe('/track')
  })

  it('sem usuário conhecido, a trilha', () => {
    expect(homeFor(null)).toBe('/track')
  })

  it('com a senha provisória, a troca obrigatória, qualquer que seja o papel', () => {
    expect(homeFor({ ...admin, mustChangePassword: true })).toBe('/change-password')
    expect(homeFor({ ...candidate, mustChangePassword: true })).toBe('/change-password')
  })
})
