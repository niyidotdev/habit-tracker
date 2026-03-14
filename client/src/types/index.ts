export interface User {
  id: string
  email: string
  username: string
  firstName?: string | null
  lastName?: string | null
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface Entry {
  id: string
  habitId: string
  completionDate: string
  note?: string | null
  createdAt: string
}

export interface Habit {
  id: string
  userId: string
  name: string
  description?: string | null
  frequency: string
  targetCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  tags?: Tag[]
  entries?: Entry[]
}

export interface HabitStats {
  name: string
  current_streak: number
  longest_streak: number
  total_completions: number
  completion_percentage: number
}

export interface AuthResponse {
  message: string
  token: string
  user: User
}

export interface ApiError {
  error: string
  message?: string
  details?: { field: string; message: string }[]
}

export type Frequency = 'daily' | 'weekly' | 'monthly'

export interface CreateHabitPayload {
  name: string
  description?: string
  frequency: Frequency
  targetCount: number
  tagIds?: string[]
}

export interface UpdateHabitPayload {
  name?: string
  description?: string
  frequency?: Frequency
  targetCount?: number
  isActive?: boolean
  tagIds?: string[]
}
