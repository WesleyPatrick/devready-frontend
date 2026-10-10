import { passwordSchema, profileSchema } from './schemas'

describe('profileSchema', () => {
  const base = { displayName: 'Ana', avatarUrl: '', currentPassword: '', newPassword: '' }

  it('recusa URL de avatar longa demais com mensagem em português', () => {
    const result = profileSchema(true).safeParse({
      ...base,
      avatarUrl: `https://example.com/${'a'.repeat(2048)}`,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]).toMatchObject({
      path: ['avatarUrl'],
      message: 'URL muito longa. Use um link com até 2048 caracteres.',
    })
  })

  it('aceita só avatar com https, como a API', () => {
    for (const avatarUrl of [
      'http://example.com/a.png',
      'javascript:alert(1)',
      'example.com/a.png',
    ]) {
      expect(profileSchema(true).safeParse({ ...base, avatarUrl }).error?.issues[0]).toMatchObject({
        path: ['avatarUrl'],
        message: 'Use um link que comece com https://.',
      })
    }
    expect(
      profileSchema(true).safeParse({ ...base, avatarUrl: 'https://example.com/a.png' }).success,
    ).toBe(true)
    expect(profileSchema(true).safeParse({ ...base, avatarUrl: '' }).success).toBe(true)
  })

  it('só exige a senha atual quando a conta já tem senha', () => {
    const values = { ...base, newPassword: 'nova-senha-1' }
    expect(profileSchema(true).safeParse(values).error?.issues[0]).toMatchObject({
      path: ['currentPassword'],
      message: 'Informe a senha atual.',
    })
    expect(profileSchema(false).safeParse(values).success).toBe(true)
  })

  it('acusa a senha atual mesmo quando a nova senha também está inválida', () => {
    const result = profileSchema(true).safeParse({ ...base, newPassword: 'curta' })
    const paths = result.error?.issues.map((issue) => issue.path[0])
    expect(paths).toContain('currentPassword')
    expect(paths).toContain('newPassword')
  })
})

describe('passwordSchema', () => {
  const LONG = 'A senha pode ter no máximo 72 bytes (letras com acento contam como 2).'

  it('conta o limite em bytes UTF-8, como o backend', () => {
    expect(passwordSchema.safeParse('a'.repeat(72)).success).toBe(true)
    expect(passwordSchema.safeParse('a'.repeat(73)).error?.issues[0].message).toBe(LONG)
    expect(passwordSchema.safeParse('ç'.repeat(40)).error?.issues[0].message).toBe(LONG)
    expect(passwordSchema.safeParse('ç'.repeat(36)).success).toBe(true)
  })
})
