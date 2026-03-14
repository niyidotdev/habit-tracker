import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sparkles, Pencil, RefreshCw, AlignLeft, Target, Tag } from 'lucide-react'
import Modal from './ui/Modal'
import { createHabit, updateHabit } from '../lib/api'
import type { Habit, CreateHabitPayload, Frequency } from '../types'
import clsx from 'clsx'

interface HabitFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** Pass an existing habit to enter edit mode */
  habit?: Habit | null
}

const FREQUENCIES: { value: Frequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekly', label: 'Weekly', description: 'Once a week' },
  { value: 'monthly', label: 'Monthly', description: 'Once a month' },
]

const EMOJI_SUGGESTIONS = ['📚', '🏃', '🧘', '💧', '🥗', '💪', '🎵', '✍️', '🌿', '🛌']

function FieldWrapper({
  label,
  icon,
  children,
  hint,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
        <span className="text-slate-400">{icon}</span>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export default function HabitFormModal({ isOpen, onClose, habit }: HabitFormModalProps) {
  const isEditing = !!habit
  const queryClient = useQueryClient()

  // ─── Form state ────────────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('daily')
  const [targetCount, setTargetCount] = useState(1)

  // Populate form when editing
  useEffect(() => {
    if (habit) {
      // Try to split an emoji prefix from the name if present
      const emojiMatch = habit.name.match(/^(\p{Emoji})\s(.+)$/u)
      if (emojiMatch) {
        setSelectedEmoji(emojiMatch[1])
        setName(emojiMatch[2])
      } else {
        setSelectedEmoji('')
        setName(habit.name)
      }
      setDescription(habit.description ?? '')
      setFrequency((habit.frequency as Frequency) ?? 'daily')
      setTargetCount(habit.targetCount ?? 1)
    } else {
      // Reset to defaults when opening for creation
      setName('')
      setSelectedEmoji('')
      setDescription('')
      setFrequency('daily')
      setTargetCount(1)
    }
  }, [habit, isOpen])

  const fullName = selectedEmoji ? `${selectedEmoji} ${name}` : name

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: CreateHabitPayload) => createHabit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Habit created! Keep it up 🎉')
      onClose()
    },
    onError: () => {
      toast.error('Could not create habit. Please try again.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreateHabitPayload) => updateHabit(habit!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['habit', habit!.id] })
      queryClient.invalidateQueries({ queryKey: ['habit-stats', habit!.id] })
      toast.success('Habit updated successfully ✨')
      onClose()
    },
    onError: () => {
      toast.error('Could not update habit. Please try again.')
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please give your habit a name.')
      return
    }

    const payload: CreateHabitPayload = {
      name: fullName.trim(),
      description: description.trim() || undefined,
      frequency,
      targetCount,
    }

    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Habit' : 'New Habit'}
      description={
        isEditing
          ? 'Update the details for this habit.'
          : 'What do you want to build into your routine?'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-5">
        {/* Emoji picker */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            Pick an emoji (optional)
          </span>
          <div className="flex flex-wrap gap-2">
            {EMOJI_SUGGESTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() =>
                  setSelectedEmoji((prev) => (prev === emoji ? '' : emoji))
                }
                className={clsx(
                  'w-9 h-9 text-lg rounded-xl transition-all duration-150 border-2',
                  selectedEmoji === emoji
                    ? 'border-violet-400 bg-violet-50 scale-110 shadow-glow'
                    : 'border-transparent bg-slate-100 hover:bg-violet-50 hover:border-violet-200',
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <FieldWrapper
          label="Habit Name"
          icon={<Sparkles className="w-3.5 h-3.5" />}
        >
          <div className="flex items-center gap-2">
            {selectedEmoji && (
              <span className="shrink-0 text-2xl leading-none select-none">
                {selectedEmoji}
              </span>
            )}
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Read for 30 minutes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              autoFocus
            />
          </div>
        </FieldWrapper>

        {/* Description */}
        <FieldWrapper
          label="Description"
          icon={<AlignLeft className="w-3.5 h-3.5" />}
          hint="Optional — helps you remember the 'why' behind this habit."
        >
          <textarea
            className="input-field resize-none min-h-[72px]"
            placeholder="e.g. Helps me wind down and stay curious"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </FieldWrapper>

        {/* Frequency */}
        <FieldWrapper
          label="Frequency"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCIES.map(({ value, label, description: desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFrequency(value)}
                className={clsx(
                  'flex flex-col items-center gap-0.5 p-3 rounded-xl border-2 transition-all duration-150 text-center',
                  frequency === value
                    ? 'border-violet-400 bg-violet-50 shadow-glow'
                    : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/50',
                )}
              >
                <span
                  className={clsx(
                    'text-sm font-semibold',
                    frequency === value ? 'text-violet-700' : 'text-slate-700',
                  )}
                >
                  {label}
                </span>
                <span
                  className={clsx(
                    'text-xs',
                    frequency === value ? 'text-violet-500' : 'text-slate-400',
                  )}
                >
                  {desc}
                </span>
              </button>
            ))}
          </div>
        </FieldWrapper>

        {/* Target count */}
        <FieldWrapper
          label="Daily Target"
          icon={<Target className="w-3.5 h-3.5" />}
          hint="How many times per period do you want to complete this habit?"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTargetCount((n) => Math.max(1, n - 1))}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-lg
                         flex items-center justify-center hover:bg-slate-50 hover:border-slate-300
                         active:scale-95 transition-all disabled:opacity-40"
              disabled={targetCount <= 1}
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-bold text-violet-700">{targetCount}</span>
              <span className="text-sm text-slate-400 ml-1">
                {targetCount === 1 ? 'time' : 'times'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTargetCount((n) => Math.min(99, n + 1))}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-lg
                         flex items-center justify-center hover:bg-slate-50 hover:border-slate-300
                         active:scale-95 transition-all disabled:opacity-40"
              disabled={targetCount >= 99}
            >
              +
            </button>
          </div>
        </FieldWrapper>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={isPending || !name.trim()}
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {isEditing ? 'Saving…' : 'Creating…'}
              </>
            ) : isEditing ? (
              <>
                <Pencil className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Habit
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
