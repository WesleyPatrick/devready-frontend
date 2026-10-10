export type Progress = {
  xp: number
  streakDays: number
  dailyGoal: { done: number; target: number }
  activity: Array<{ date: string; count: number }>
}

export type Achievement = {
  slug: string
  name: string
  description: string
  icon: string
  unlockedAt: string | null
}
