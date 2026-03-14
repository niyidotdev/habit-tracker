import { useQuery } from '@tanstack/react-query'
import {
  Flame,
  Trophy,
  CheckCircle2,
  TrendingUp,
  CalendarDays,
  AlertCircle,
} from 'lucide-react'
import Modal from './ui/Modal'
import { fetchHabitStats, fetchHabitById } from '../lib/api'
import type { Habit } from '../types'
import {
  completionColor,
  formatRelativeDay,
  frequencyLabel,
  getAccentColor,
  clamp,
} from '../lib/utils'
import clsx from 'clsx'

interface HabitStatsModalProps {
  isOpen: boolean
  onClose: () => void
  habit: Habit | null
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({
  percentage,
  size = 120,
  stroke = 9,
}: {
  percentage: number
  size?: number
  stroke?: number
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = clamp(percentage, 0, 100)
  const offset = circumference - (pct / 100) * circumference

  const color =
    pct >= 80
      ? '#059669' // emerald
      : pct >= 50
        ? '#d97706' // amber
        : '#f43f5e' // rose

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="progress-ring"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none" style={{ color }}>
          {pct.toFixed(pct < 10 ? 1 : 0)}%
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wide uppercase">
          Done
        </span>
      </div>
    </div>
  )
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  sub,
  iconBg,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: string
  iconBg: string
}) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div
        className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center',
          iconBg,
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 leading-none">
          {value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wide">
          {label}
        </p>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse rounded-lg bg-slate-100', className)} />
  )
}

function StatsSkeleton() {
  return (
    <div className="px-6 pb-6 flex flex-col gap-5">
      <div className="flex items-center justify-center py-4">
        <Skeleton className="w-[120px] h-[120px] rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4 flex flex-col gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HabitStatsModal({
  isOpen,
  onClose,
  habit,
}: HabitStatsModalProps) {
  const habitId = habit?.id ?? ''

  const statsQuery = useQuery({
    queryKey: ['habit-stats', habitId],
    queryFn: () => fetchHabitStats(habitId),
    enabled: isOpen && !!habitId,
    staleTime: 1000 * 60,
  })

  const detailQuery = useQuery({
    queryKey: ['habit', habitId],
    queryFn: () => fetchHabitById(habitId),
    enabled: isOpen && !!habitId,
    staleTime: 1000 * 60,
  })

  const stats = statsQuery.data
  const entries = detailQuery.data?.habit?.entries ?? []
  const accent = habit ? getAccentColor(habit.name) : null
  const isLoading = statsQuery.isLoading || detailQuery.isLoading
  const isError = statsQuery.isError || detailQuery.isError

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" hideHeader>
      {/* Coloured banner header */}
      {habit && accent && (
        <div
          className={clsx(
            'relative rounded-t-2xl px-6 pt-8 pb-6 flex flex-col items-center gap-1 text-center',
            accent.bg,
          )}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 text-white
                       hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
          <span className="text-4xl mb-1" aria-hidden="true">
            {habit.name.match(/^\p{Emoji}/u)?.[0] ?? '⭐'}
          </span>
          <h2 className="text-xl font-bold text-white leading-snug px-8">
            {habit.name.replace(/^\p{Emoji}\s?/u, '')}
          </h2>
          <span
            className={clsx(
              'badge mt-1 bg-white/20 text-white text-xs font-medium',
            )}
          >
            {frequencyLabel(habit.frequency)}
          </span>
        </div>
      )}

      {isLoading && <StatsSkeleton />}

      {isError && (
        <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-slate-500 text-sm">
            Could not load stats. Please try again.
          </p>
        </div>
      )}

      {!isLoading && !isError && stats && (
        <div className="px-6 pb-6 flex flex-col gap-5 pt-5">
          {/* Progress ring centred */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-2">
              <ProgressRing percentage={stats.completion_percentage} />
              <p className="text-xs text-slate-400 font-medium">
                Completion rate vs. expected
              </p>
            </div>
          </div>

          {/* Stat tiles grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon={<Flame className="w-4 h-4 text-amber-600" />}
              label="Current Streak"
              value={
                <span className="flex items-center gap-1">
                  {stats.current_streak > 0 && (
                    <span className="text-amber-500">🔥</span>
                  )}
                  {stats.current_streak}
                </span>
              }
              sub={stats.current_streak === 1 ? 'day' : 'days'}
              iconBg="bg-amber-100"
            />
            <StatTile
              icon={<Trophy className="w-4 h-4 text-violet-600" />}
              label="Longest Streak"
              value={stats.longest_streak}
              sub={stats.longest_streak === 1 ? 'day' : 'days'}
              iconBg="bg-violet-100"
            />
            <StatTile
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              label="Total Completions"
              value={stats.total_completions}
              sub={stats.total_completions === 1 ? 'check-in' : 'check-ins'}
              iconBg="bg-emerald-100"
            />
            <StatTile
              icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
              label="Completion Rate"
              value={
                <span className={completionColor(stats.completion_percentage)}>
                  {stats.completion_percentage.toFixed(1)}%
                </span>
              }
              iconBg="bg-blue-100"
            />
          </div>

          {/* Streak motivational callout */}
          {stats.current_streak >= 3 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-3">
              <span className="text-2xl leading-none shrink-0">🔥</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {stats.current_streak >= 30
                    ? "You're on fire! Incredible dedication."
                    : stats.current_streak >= 14
                      ? 'Two weeks strong — amazing consistency!'
                      : stats.current_streak >= 7
                        ? "One full week! You're building something real."
                        : `${stats.current_streak}-day streak going. Don't break the chain!`}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Keep going — every day counts.
                </p>
              </div>
            </div>
          )}

          {/* Recent entries */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Recent Check-ins
              </h3>
            </div>

            {entries.length === 0 ? (
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-5 text-center">
                <p className="text-sm text-slate-400">No check-ins yet.</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hit the{' '}
                  <span className="font-medium text-violet-500">Complete</span>{' '}
                  button to log your first one!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {entries.slice(0, 7).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">
                        {formatRelativeDay(entry.completionDate)}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {entry.note}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(entry.completionDate).toLocaleTimeString(
                        'en-US',
                        {
                          hour: 'numeric',
                          minute: '2-digit',
                        },
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
