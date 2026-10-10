import { formatList, formatNumber, formatPercent, formatRelative, isoDate } from './format'

describe('format', () => {
  it('junta nomes em português', () => {
    expect(formatList(['Nubank'])).toBe('Nubank')
    expect(formatList(['Nubank', 'Google'])).toBe('Nubank e Google')
    expect(formatList(['Nubank', 'Google', 'Mercado Livre'])).toBe('Nubank, Google e Mercado Livre')
  })
  it('número com ponto de milhar e porcentagem inteira', () => {
    expect(formatNumber(1240)).toBe('1.240')
    expect(formatPercent(0.714)).toBe('71%')
  })
  it('tempo relativo', () => {
    const now = new Date('2030-01-10T12:00:00Z')
    expect(formatRelative('2030-01-10T11:00:00Z', now)).toBe('há 1 hora')
    expect(formatRelative('2030-01-09T12:00:00Z', now)).toBe('ontem')
    expect(formatRelative('2030-01-10T11:59:50Z', now)).toBe('agora')
  })
  it('data ISO local', () => {
    expect(isoDate(new Date(2030, 0, 5))).toBe('2030-01-05')
  })
})
