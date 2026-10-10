import { Award, Zap } from 'lucide-react'
import { achievementIcon } from './achievementIcons'

describe('achievementIcon', () => {
  it('devolve o ícone do nome conhecido', () => {
    expect(achievementIcon('zap')).toBe(Zap)
  })

  it('nome desconhecido cai no Award', () => {
    expect(achievementIcon('xyz')).toBe(Award)
  })
})
