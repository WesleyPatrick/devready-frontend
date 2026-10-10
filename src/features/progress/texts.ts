export const progressTexts = {
  chips: {
    streak: (days: number) => (days === 1 ? 'Sequência de 1 dia' : `Sequência de ${days} dias`),
    xp: (xp: string) => `${xp} XP`,
  },
  toast: { unlocked: 'Conquista desbloqueada' },
} as const
