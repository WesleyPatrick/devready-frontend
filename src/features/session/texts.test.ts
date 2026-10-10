import { sessionTexts } from './texts'

describe('confirmação de encerrar', () => {
  const body = sessionTexts.banner.confirmBody

  it('lição: fala só das questões, sem desafios', () => {
    expect(body(3, 0)).toBe(
      '3 questões ainda sem resposta contam como erro. A correção começa agora.',
    )
    expect(body(1, 0)).toBe(
      '1 questão ainda sem resposta conta como erro. A correção começa agora.',
    )
  })

  it('simulação: questões e desafios juntos', () => {
    expect(body(8, 2)).toBe(
      '8 questões e 2 desafios ainda sem resposta contam como erro. A correção começa agora.',
    )
  })

  it('só desafios pendentes: não fala de 0 questões', () => {
    expect(body(0, 1)).toBe(
      '1 desafio ainda sem resposta conta como erro. A correção começa agora.',
    )
  })

  it('tudo respondido', () => {
    expect(body(0, 0)).toBe('Tudo respondido. A correção começa agora.')
  })
})

describe('envios restantes', () => {
  it('usa o limite do desafio, não um número fixo', () => {
    expect(sessionTexts.challenge.left(2, 3)).toBe('Envios restantes: 2 de 3')
  })
})
