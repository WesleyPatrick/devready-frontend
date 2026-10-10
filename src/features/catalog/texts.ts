import type { Level } from './api'

export const catalogTexts = {
  title: 'Nova simulação',
  subtitle:
    'Escolha a área e o nível. A sessão tem tempo marcado e mistura questões objetivas e desafios de código.',
  area: 'Área',
  level: 'Nível',
  levels: { JUNIOR: 'Júnior', PLENO: 'Pleno', SENIOR: 'Sênior' } satisfies Record<Level, string>,
  card: {
    questions: (n: number) => (n === 1 ? '1 questão objetiva' : `${n} questões objetivas`),
    challenges: (n: number) => (n === 1 ? '1 desafio de código' : `${n} desafios de código`),
    duration: (min: number) => `${min} minutos`,
    weight: (w: number) => `Objetivas valem ${Math.round(w * 100)}% da nota`,
  },
  start: 'Iniciar simulação',
  starting: 'Começando…',
  noLevels: 'Ainda não há conteúdo suficiente para uma simulação nesta área.',
  chooseArea: 'Escolha uma área para começar.',
  startError: 'Não deu para começar a simulação. Tente de novo.',
  continueOpen: 'Continuar',
  loading: 'Carregando áreas…',
  empty: 'Nenhuma área disponível no momento.',
  error: 'Não foi possível carregar as áreas. Tente de novo.',
} as const
