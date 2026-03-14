import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  CheckCircle2,
  Circle,
  MoreVertical,
  Pencil,
  Trash2,
  BarChart2,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { completeHabit, fetchHabitStats } from '../lib/api'
import type { Habit } from '../types'
import {
  getAccentColor,
  frequencyLabel,
  frequencyBadgeClass,
} from '../lib/utils'
import clsx from 'clsx'

interface HabitCardProps {
  habit: Habit
  isCompletedToday: boolean
  onCompletedToday: (habitId: string) => void
  onEdit: (habit: Habit) => void
  onDelete: (habit: Habit) => void
  onViewStats: (habit: Habit) => void
}

// ─── Dropdown menu ────────────────────────────────────────────────────────────

interface MenuProps {
  isOpen: boolean
  onEdit: () => void
  onStats: () => void
  onDelete: () => void
  onClose: () => void
}

function DropdownMenu({
  isOpen,
  onEdit,
  onStats,
  onDelete,
  onClose,
}: MenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={clsx(
        'absolute top-8 right-0 z-20 w-44',
        'card shadow-soft py-1 animate-scale-in',
      )}
      role="menu"
    >
      <button
        onClick={() => {
          onEdit()
          onClose()
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600
                   hover:bg-slate-50 hover:text-slate-800 transition-colors text-left"
        role="menuitem"
      >
        <Pencil className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        Edit habit
      </button>
      <button
        onClick={() => {
          onStats()
          onClose()
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600
                   hover:bg-slate-50 hover:text-slate-800 transition-colors text-left"
        role="menuitem"
      >
        <BarChart2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        View stats
      </button>
      <div className="my-1 border-t border-slate-100" role="separator" />
      <button
        onClick={() => {
          onDelete()
          onClose()
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-500
                   hover:bg-rose-50 transition-colors text-left"
        role="menuitem"
      >
        <Trash2 className="w-3.5 h-3.5 shrink-0" />
        Delete habit
      </button>
    </div>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────

export default function HabitCard({
  habit,
  isCompletedToday,
  onCompletedToday,
  onEdit,
  onDelete,
  onViewStats,
}: HabitCardProps) {
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)

  // Fetch stats in the background so we can show the streak on the card
  const { data: stats } = useQuery({
    queryKey: ['habit-stats', habit.id],
    queryFn: () => fetchHabitStats(habit.id),
    staleTime: 1000 * 60 * 5, // 5 min
    // Lower priority — don't block the card render
    enabled: true,
  })

  const accent = getAccentColor(habit.name)

  // ─── Complete mutation ─────────────────────────────────────────────────────
  const { mutate: complete, isPending } = useMutation({
    mutationFn: () => completeHabit(habit.id),
    onSuccess: () => {
      onCompletedToday(habit.id)
      queryClient.invalidateQueries({ queryKey: ['habit-stats', habit.id] })
      queryClient.invalidateQueries({ queryKey: ['habit', habit.id] })
      toast.success(
        <span>
          <span className="font-semibold">{habit.name}</span> completed! Keep it
          up 🙌
        </span>,
        { duration: 3000 },
      )
    },
    onError: (err: unknown) => {
      // 409 = already completed today
      const status = (err as { response?: { status?: number } })?.response
        ?.status
      if (status === 409) {
        onCompletedToday(habit.id)
        toast('Already done today — great work! ✅', {
          icon: '✅',
          duration: 2500,
        })
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    },
  })

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isCompletedToday || isPending) return
    complete()
  }

  const currentStreak = stats?.current_streak ?? 0
  const hasActiveStreak = currentStreak > 0

  return (
    <div
      className={clsx(
        'group relative flex flex-col rounded-2xl border overflow-hidden',
        'bg-white transition-all duration-200',
        'hover:shadow-soft hover:-translate-y-0.5 cursor-default',
        isCompletedToday
          ? 'border-emerald-200 shadow-[0_1px_3px_rgba(5,150,105,0.1)]'
          : 'border-slate-100 shadow-card',
      )}
      onClick={() => onViewStats(habit)}
      role="article"
      aria-label={`${habit.name} habit card`}
    >
      {/* Coloured top bar */}
      <div
        className={clsx(
          'h-1.5 w-full transition-all duration-300',
          isCompletedToday ? 'bg-emerald-gradient' : accent.bg,
        )}
      />

      {/* Card body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Top row: name + menu */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className={clsx(
              'font-semibold leading-snug text-base flex-1 min-w-0',
              isCompletedToday ? 'text-emerald-800' : 'text-slate-800',
            )}
          >
            {habit.name}
          </h3>

          {/* Three-dot menu */}
          <div
            className="relative shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={clsx(
                'p-1.5 rounded-lg transition-all duration-150',
                'text-slate-300 hover:text-slate-500 hover:bg-slate-100',
                menuOpen && 'bg-slate-100 text-slate-500',
              )}
              aria-label="Habit options"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <DropdownMenu
              isOpen={menuOpen}
              onEdit={() => onEdit(habit)}
              onStats={() => onViewStats(habit)}
              onDelete={() => onDelete(habit)}
              onClose={() => setMenuOpen(false)}
            />
          </div>
        </div>

        {/* Description */}
        {habit.description && (
          <p className="text-sm text-slate-400 leading-snug line-clamp-2 -mt-1">
            {habit.description}
          </p>
        )}

        {/* Tags */}
        {habit.tags && habit.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {habit.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: tag.color + '22',
                  color: tag.color,
                  border: `1px solid ${tag.color}44`,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom row: frequency + streak + complete button */}
        <div
          className="flex items-center gap-2 pt-2 border-t border-slate-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Frequency badge */}
          <span
            className={clsx(
              'badge text-xs shrink-0',
              frequencyBadgeClass(habit.frequency),
            )}
          >
            {frequencyLabel(habit.frequency)}
          </span>

          {/* Streak badge */}
          {hasActiveStreak && (
            <span
              className={clsx(
                'badge shrink-0',
                isCompletedToday
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-amber-50 text-amber-600',
              )}
              title={`${currentStreak}-day streak`}
            >
              🔥 {currentStreak}
            </span>
          )}

          {/* Target count if > 1 */}
          {habit.targetCount > 1 && (
            <span className="badge bg-slate-100 text-slate-500 shrink-0">
              <Zap className="w-2.5 h-2.5 mr-0.5" />×{habit.targetCount}
            </span>
          )}

          <div className="flex-1" />

          {/* Complete button */}
          <button
            onClick={handleComplete}
            disabled={isCompletedToday || isPending}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold',
              'transition-all duration-150 active:scale-95 shrink-0',
              isCompletedToday
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : isPending
                  ? 'bg-violet-100 text-violet-400 cursor-wait'
                  : 'bg-violet-gradient text-white shadow-sm hover:shadow-glow hover:opacity-90',
            )}
            aria-label={
              isCompletedToday ? 'Completed today' : 'Mark as complete'
            }
          >
            {isPending ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Saving…</span>
              </>
            ) : isCompletedToday ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done!</span>
              </>
            ) : (
              <>
                <Circle className="w-3 h-3" />
                <span>Complete</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Streak milestone glow ring — shown when streak is a milestone */}
      {!isCompletedToday &&
        hasActiveStreak &&
        (currentStreak === 7 ||
          currentStreak === 14 ||
          currentStreak === 30 ||
          currentStreak === 100) && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl
                       ring-2 ring-amber-300/60 ring-offset-1 animate-pulse-soft"
            aria-hidden="true"
          />
        )}

      {/* Completed today overlay shimmer */}
      {isCompletedToday && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl
                     bg-gradient-to-br from-emerald-400/5 to-transparent"
          aria-hidden="true"
        />
      )}
    </div>
  )
}
