export const ACCENT_COLORS = [
  { bg: 'bg-violet-500', light: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  { bg: 'bg-blue-500',   light: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200'   },
  { bg: 'bg-emerald-500',light: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200'},
  { bg: 'bg-amber-500',  light: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200'  },
  { bg: 'bg-rose-500',   light: 'bg-rose-100',   text: 'text-rose-700',   border: 'border-rose-200'   },
  { bg: 'bg-cyan-500',   light: 'bg-cyan-100',   text: 'text-cyan-700',   border: 'border-cyan-200'   },
  { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bg: 'bg-teal-500',   light: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-200'   },
] as const

export type AccentColor = (typeof ACCENT_COLORS)[number]

/** Pick a deterministic accent color for a habit based on its name */
export function getAccentColor(habitName: string): AccentColor {
  let hash = 0
  for (let i = 0; i < habitName.length; i++) {
    hash = habitName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % ACCENT_COLORS.length
  return ACCENT_COLORS[index]
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns true if the given date string/Date is today (local time) */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

/** "Monday, June 9" */
export function formatDayFull(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/** "Jun 9" */
export function formatDayShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Returns a friendly relative string: "Today", "Yesterday", or "Jun 3" */
export function formatRelativeDay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'Today'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday'
  }
  return formatDayShort(d)
}

/** Number of days between two dates (ignoring time) */
export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.abs(Math.floor((utcB - utcA) / msPerDay))
}

// ─── Frequency helpers ────────────────────────────────────────────────────────

const FREQUENCY_LABELS: Record<string, string> = {
  daily:   'Daily',
  weekly:  'Weekly',
  monthly: 'Monthly',
}

const FREQUENCY_COLORS: Record<string, string> = {
  daily:   'bg-violet-100 text-violet-700',
  weekly:  'bg-blue-100 text-blue-700',
  monthly: 'bg-amber-100 text-amber-700',
}

export function frequencyLabel(frequency: string): string {
  return FREQUENCY_LABELS[frequency.toLowerCase()] ?? frequency
}

export function frequencyBadgeClass(frequency: string): string {
  return FREQUENCY_COLORS[frequency.toLowerCase()] ?? 'bg-slate-100 text-slate-600'
}

// ─── Streak helpers ───────────────────────────────────────────────────────────

/** Returns a flame emoji + count string, e.g. "🔥 7" */
export function streakLabel(count: number): string {
  if (count === 0) return '—'
  return `🔥 ${count}`
}

/** Maps a completion percentage to a soothing colour class */
export function completionColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-rose-500'
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Greeting based on current hour */
export function timeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
