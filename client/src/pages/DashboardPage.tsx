import { useState, useCallback } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  useQueries,
} from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Plus,
  Sparkles,
  Flame,
  CheckCircle2,
  LayoutGrid,
  Trash2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ListTodo,
} from 'lucide-react'
import { fetchHabits, deleteHabit, fetchHabitById } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import HabitCard from '../components/HabitCard'
import HabitFormModal from '../components/HabitFormModal'
import HabitStatsModal from '../components/HabitStatsModal'
import Modal from '../components/ui/Modal'
import Sidebar, { MobileMenuButton } from '../components/Sidebar'
import type { Habit } from '../types'
import { formatDayFull, isToday, timeGreeting } from '../lib/utils'
import clsx from 'clsx'

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: string
  iconBg: string
  loading?: boolean
}) {
  return (
    <div className="stat-card">
      <div
        className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          iconBg,
        )}
      >
        {icon}
      </div>
      <div className="mt-1">
        {loading ? (
          <div className="h-7 w-12 rounded-lg bg-slate-100 animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-slate-800 leading-none">
            {value}
          </p>
        )}
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wide">
          {label}
        </p>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div
        className="w-20 h-20 rounded-3xl bg-violet-100 flex items-center justify-center mb-6
                   shadow-inner"
        aria-hidden="true"
      >
        <ListTodo className="w-9 h-9 text-violet-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-700 mb-2">No habits yet</h3>
      <p className="text-slate-400 text-sm max-w-xs leading-relaxed mb-8">
        Start small. Pick one habit you want to build and track it every day —
        consistency is everything.
      </p>
      <button onClick={onAdd} className="btn-primary px-6 py-3">
        <Plus className="w-4 h-4" />
        Add your first habit
      </button>
    </div>
  )
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="card flex flex-col gap-3 p-4 overflow-hidden">
      <div className="h-1.5 w-full bg-slate-100 rounded-full -mx-4 -mt-4 mb-1" />
      <div className="flex items-start justify-between gap-2">
        <div className="h-5 w-2/3 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-7 w-7 rounded-lg bg-slate-100 animate-pulse shrink-0" />
      </div>
      <div className="h-3.5 w-full rounded-lg bg-slate-100 animate-pulse" />
      <div className="h-3.5 w-4/5 rounded-lg bg-slate-100 animate-pulse" />
      <div className="flex items-center gap-2 pt-2 mt-1 border-t border-slate-50">
        <div className="h-5 w-14 rounded-full bg-slate-100 animate-pulse" />
        <div className="h-5 w-10 rounded-full bg-slate-100 animate-pulse" />
        <div className="flex-1" />
        <div className="h-7 w-24 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    </div>
  )
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

interface DeleteModalProps {
  habit: Habit | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

function DeleteModal({
  habit,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: DeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete habit?"
      description={`This will permanently delete "${habit?.name}" and all its history. This cannot be undone.`}
      size="sm"
    >
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onClose}
          className="btn-secondary flex-1"
          disabled={isPending}
        >
          Keep it
        </button>
        <button
          onClick={onConfirm}
          className="btn-danger flex-1"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Deleting…
            </>
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </>
          )}
        </button>
      </div>
    </Modal>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type FilterType = 'all' | 'daily' | 'weekly' | 'monthly'

interface FilterBarProps {
  search: string
  onSearch: (v: string) => void
  filter: FilterType
  onFilter: (v: FilterType) => void
  total: number
}

function FilterBar({
  search,
  onSearch,
  filter,
  onFilter,
  total,
}: FilterBarProps) {
  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          className="input-field pl-9"
          placeholder="Search habits…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search habits"
        />
      </div>

      {/* Frequency filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {filters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onFilter(value)}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150',
              filter === value
                ? 'bg-violet-gradient text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-violet-300 hover:text-violet-600',
            )}
          >
            {label}
            {value === 'all' && (
              <span
                className={clsx(
                  'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  filter === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-400',
                )}
              >
                {total}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // ─── UI state ──────────────────────────────────────────────────────────────
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [statsHabit, setStatsHabit] = useState<Habit | null>(null)
  const [statsModalOpen, setStatsModalOpen] = useState(false)
  const [deleteHabitTarget, setDeleteHabitTarget] = useState<Habit | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [frequencyFilter, setFrequencyFilter] = useState<FilterType>('all')

  // ─── Fetch habits ──────────────────────────────────────────────────────────
  const {
    data: habitsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['habits'],
    queryFn: fetchHabits,
    staleTime: 1000 * 30,
  })

  const habits = habitsData?.habits ?? []

  // ─── Background-fetch each habit detail to determine "completed today" ─────
  // This gives us entries for each habit so we can pre-populate completedToday
  const habitDetailQueries = useQueries({
    queries: habits.map((habit) => ({
      queryKey: ['habit', habit.id],
      queryFn: () => fetchHabitById(habit.id),
      staleTime: 1000 * 60 * 2,
      enabled: habits.length > 0,
    })),
  })

  // Merge server-derived completions with session completions
  const serverCompletedToday = new Set<string>(
    habitDetailQueries
      .map((q, i) => {
        const entries = q.data?.habit?.entries ?? []
        const doneTodayInServer = entries.some((e) => isToday(e.completionDate))
        return doneTodayInServer ? habits[i]?.id : undefined
      })
      .filter((id): id is string => !!id),
  )

  const allCompletedToday = new Set([
    ...serverCompletedToday,
    ...completedToday,
  ])

  const markCompletedToday = useCallback((habitId: string) => {
    setCompletedToday((prev) => new Set([...prev, habitId]))
  }, [])

  // ─── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Habit deleted.')
      setDeleteModalOpen(false)
      setDeleteHabitTarget(null)
    },
    onError: () => {
      toast.error('Could not delete habit. Please try again.')
    },
  })

  // ─── Derived stats ─────────────────────────────────────────────────────────
  const totalHabits = habits.length
  const completedTodayCount = allCompletedToday.size
  const bestStreakAcrossHabits = habitDetailQueries.reduce((best, q) => {
    // Pull streak from the cached stats query if available
    const cached = queryClient.getQueryData<{
      current_streak: number
    }>(['habit-stats', q.data?.habit?.id ?? ''])
    return Math.max(best, cached?.current_streak ?? 0)
  }, 0)

  // ─── Filtered habits ───────────────────────────────────────────────────────
  const filteredHabits = habits.filter((h) => {
    const matchesSearch =
      !search ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesFrequency =
      frequencyFilter === 'all' || h.frequency.toLowerCase() === frequencyFilter
    return matchesSearch && matchesFrequency
  })

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingHabit(null)
    setFormModalOpen(true)
  }

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setFormModalOpen(true)
  }

  const handleOpenStats = (habit: Habit) => {
    setStatsHabit(habit)
    setStatsModalOpen(true)
  }

  const handleOpenDelete = (habit: Habit) => {
    setDeleteHabitTarget(habit)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deleteHabitTarget) {
      deleteMutation.mutate(deleteHabitTarget.id)
    }
  }

  const displayName = user?.firstName
    ? user.firstName
    : (user?.username ?? 'there')

  return (
    <div className="flex min-h-screen bg-app-gradient">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* ── Top bar (mobile only) ── */}
        <header
          className="lg:hidden sticky top-0 z-30 flex items-center justify-between
                           px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-slate-100"
        >
          <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-gradient flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm">Habitual</span>
          </div>
          <button
            onClick={handleOpenCreate}
            className="w-8 h-8 rounded-xl bg-violet-gradient flex items-center justify-center
                       text-white shadow-sm hover:opacity-90 transition-opacity"
            aria-label="Add habit"
          >
            <Plus className="w-4 h-4" />
          </button>
        </header>

        {/* ── Page body ── */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto w-full">
          {/* Greeting header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 leading-tight">
                {timeGreeting()}, {displayName}! 👋
              </h1>
              <p className="text-sm text-slate-400 mt-1">{formatDayFull()}</p>
            </div>

            {/* Desktop add button */}
            <button
              onClick={handleOpenCreate}
              className="hidden lg:flex btn-primary shrink-0"
            >
              <Plus className="w-4 h-4" />
              New Habit
            </button>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 mb-7">
            <StatCard
              icon={<LayoutGrid className="w-4 h-4 text-violet-600" />}
              label="Total Habits"
              value={totalHabits}
              sub={totalHabits === 1 ? 'habit tracked' : 'habits tracked'}
              iconBg="bg-violet-100"
              loading={isLoading}
            />
            <StatCard
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              label="Done Today"
              value={
                <span
                  className={
                    completedTodayCount > 0 ? 'text-emerald-600' : undefined
                  }
                >
                  {completedTodayCount}
                </span>
              }
              sub={`of ${totalHabits} habit${totalHabits !== 1 ? 's' : ''}`}
              iconBg="bg-emerald-100"
              loading={isLoading}
            />
            <StatCard
              icon={<Flame className="w-4 h-4 text-amber-600" />}
              label="Best Streak"
              value={
                bestStreakAcrossHabits > 0 ? (
                  <span className="flex items-center gap-1">
                    🔥<span>{bestStreakAcrossHabits}</span>
                  </span>
                ) : (
                  '—'
                )
              }
              sub={
                bestStreakAcrossHabits === 1
                  ? 'day'
                  : bestStreakAcrossHabits > 0
                    ? 'days'
                    : 'no streaks yet'
              }
              iconBg="bg-amber-100"
              loading={isLoading}
            />
          </div>

          {/* All-done banner */}
          {!isLoading &&
            totalHabits > 0 &&
            completedTodayCount === totalHabits && (
              <div
                className="mb-6 rounded-2xl bg-emerald-gradient px-5 py-4 flex items-center gap-4
                            shadow-sm animate-slide-up"
              >
                <span className="text-3xl leading-none" aria-hidden="true">
                  🎉
                </span>
                <div>
                  <p className="text-sm font-bold text-white">
                    All done for today — incredible work!
                  </p>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    You've completed every habit. Come back tomorrow to keep
                    your streaks going.
                  </p>
                </div>
              </div>
            )}

          {/* Error state */}
          {isError && (
            <div className="card p-8 flex flex-col items-center gap-3 text-center mb-6">
              <p className="text-slate-500 text-sm">
                Could not load your habits.
              </p>
              <button
                onClick={() => refetch()}
                className="btn-secondary text-sm py-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </button>
            </div>
          )}

          {/* Filter bar (only when there are habits) */}
          {!isLoading && habits.length > 0 && (
            <div className="mb-5">
              <FilterBar
                search={search}
                onSearch={setSearch}
                filter={frequencyFilter}
                onFilter={setFrequencyFilter}
                total={habits.length}
              />
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && habits.length === 0 && (
            <EmptyState onAdd={handleOpenCreate} />
          )}

          {/* No search results */}
          {!isLoading &&
            !isError &&
            habits.length > 0 &&
            filteredHabits.length === 0 && (
              <div className="card p-10 flex flex-col items-center gap-3 text-center">
                <Search className="w-8 h-8 text-slate-300" />
                <p className="text-slate-500 text-sm font-medium">
                  No habits match your search.
                </p>
                <button
                  onClick={() => {
                    setSearch('')
                    setFrequencyFilter('all')
                  }}
                  className="btn-secondary text-sm py-2"
                >
                  Clear filters
                </button>
              </div>
            )}

          {/* Habit grid */}
          {!isLoading && !isError && filteredHabits.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {filteredHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isCompletedToday={allCompletedToday.has(habit.id)}
                  onCompletedToday={markCompletedToday}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  onViewStats={handleOpenStats}
                />
              ))}
            </div>
          )}

          {/* Completion progress bar (only when there are habits) */}
          {!isLoading && totalHabits > 0 && (
            <div className="mt-8 card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Today's progress
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {completedTodayCount} / {totalHabits}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-gradient transition-all duration-700 ease-out"
                  style={{
                    width:
                      totalHabits > 0
                        ? `${Math.round((completedTodayCount / totalHabits) * 100)}%`
                        : '0%',
                  }}
                  role="progressbar"
                  aria-valuenow={completedTodayCount}
                  aria-valuemin={0}
                  aria-valuemax={totalHabits}
                  aria-label="Today's habit completion"
                />
              </div>
              <p className="text-xs text-slate-400">
                {completedTodayCount === 0
                  ? "You haven't started yet — let's go!"
                  : completedTodayCount === totalHabits
                    ? 'All habits completed today! 🎉'
                    : `${totalHabits - completedTodayCount} habit${totalHabits - completedTodayCount !== 1 ? 's' : ''} left to go.`}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      <HabitFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setEditingHabit(null)
        }}
        habit={editingHabit}
      />

      <HabitStatsModal
        isOpen={statsModalOpen}
        onClose={() => {
          setStatsModalOpen(false)
          setStatsHabit(null)
        }}
        habit={statsHabit}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDeleteHabitTarget(null)
        }}
        habit={deleteHabitTarget}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
