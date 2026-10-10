import { companiesOf, visibleLevels } from './learning'

const nubank = { slug: 'nubank', name: 'Nubank' }
const google = { slug: 'google', name: 'Google' }
const itau = { slug: 'itau', name: 'Itaú' }

it('"quem pede" segue a ordem das empresas escolhidas, não a da lista recebida', () => {
  expect(companiesOf(['google', 'nubank'], [nubank, itau, google])).toEqual([nubank, google])
  expect(companiesOf(['desconhecida'], [nubank])).toEqual([])
})

it('cada senioridade vê o próprio nível e os de baixo, como o backend', () => {
  expect(visibleLevels('JUNIOR')).toEqual(['JUNIOR'])
  expect(visibleLevels('PLENO')).toEqual(['JUNIOR', 'PLENO'])
  expect(visibleLevels('SENIOR')).toEqual(['JUNIOR', 'PLENO', 'SENIOR'])
})
