import { monogramOf } from './monograms'

it('empresa conhecida tem iniciais e cor próprias; desconhecida usa as iniciais do nome', () => {
  expect(monogramOf('nubank', 'Nubank')).toEqual({ initials: 'Nu', color: '#b18cf2' })
  expect(monogramOf('banco-exemplo', 'Banco Exemplo')).toEqual({ initials: 'BE', color: '#a3a3a3' })
  expect(monogramOf('itau', 'Itaú')).toEqual({ initials: 'It', color: '#a3a3a3' })
})
