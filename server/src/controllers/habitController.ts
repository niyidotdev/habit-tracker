import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'
import { db } from '../db/connection.ts'
import { habits, entries, habitTags, tags } from '../db/schema.ts'
import { eq, and, desc, gte, lte } from 'drizzle-orm'

export const createHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, frequency, targetCount, tagIds } = req.body
    const result = await db.transaction(async (tx) => {
      const [newHabit] = await tx
        .insert(habits)
        .values({
          userId: req.user.id,
          name,
          description,
          frequency,
          targetCount,
        })
        .returning()

      if (tagIds && tagIds.length > 0) {
        const habitTagValues = tagIds.map((tagId: number) => ({
          habitId: newHabit.id,
          tagId,
        }))

        await tx.insert(habitTags).values(habitTagValues)
      }

      return newHabit
    })

    res.status(201).json({ message: 'Habit created', habit: result })
  } catch (error) {
    console.error('Error creating habit:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getUserHabits = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userHabitsWithTags = await db.query.habits.findMany({
      where: eq(habits.userId, req.user.id),
      with: {
        habitTags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [desc(habits.createdAt)],
    })

    const habitsWithTags = userHabitsWithTags.map((habit) => ({
      ...habit,
      tags: habit.habitTags.map((ht) => ht.tag),
      habitTags: undefined,
    }))

    res.json({ habits: habitsWithTags })
  } catch (error) {
    console.log('Get habits error', error)
    res.status(500).json({ error: 'Failed to create habit' })
  }
}

export const getHabitById = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, id), eq(habits.userId, userId)),
      with: {
        habitTags: {
          with: {
            tag: true,
          },
        },
        entries: {
          orderBy: [desc(entries.completionDate)],
          limit: 10, // Recent entries only
        },
      },
    })

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    // Transform the data
    const habitWithTags = {
      ...habit,
      tags: habit.habitTags.map((ht) => ht.tag),
      habitTags: undefined,
    }

    res.json({
      habit: habitWithTags,
    })
  } catch (error) {
    console.error('Get habit error:', error)
    res.status(500).json({ error: 'Failed to fetch habit' })
  }
}

export const updateHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { tagIds, ...updates } = req.body

    const result = await db.transaction(async (tx) => {
      // Update the habit
      const [updatedHabit] = await tx
        .update(habits)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(habits.id, id), eq(habits.userId, userId)))
        .returning()

      if (!updatedHabit) {
        throw new Error('Habit not found')
      }

      // If tagIds are provided, update the associations
      if (tagIds !== undefined) {
        // Remove existing tags
        await tx.delete(habitTags).where(eq(habitTags.habitId, id))

        // Add new tags
        if (tagIds.length > 0) {
          const habitTagValues = tagIds.map((tagId: string) => ({
            habitId: id,
            tagId,
          }))
          await tx.insert(habitTags).values(habitTagValues)
        }
      }

      return updatedHabit
    })

    res.json({
      message: 'Habit updated successfully',
      habit: result,
    })
  } catch (error: any) {
    if (error.message === 'Habit not found') {
      return res.status(404).json({ error: 'Habit not found' })
    }
    console.error('Update habit error:', error)
    res.status(500).json({ error: 'Failed to update habit' })
  }
}

export const deleteHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const [deletedHabit] = await db
      .delete(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .returning()

    if (!deletedHabit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    res.json({
      message: 'Habit deleted successfully',
    })
  } catch (error) {
    console.error('Delete habit error:', error)
    res.status(500).json({ error: 'Failed to delete habit' })
  }
}

export const completeHabit = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { note } = req.body

    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, id), eq(habits.userId, userId)),
    })

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const existingEntry = await db.query.entries.findFirst({
      where: and(
        eq(entries.habitId, id),
        gte(entries.completionDate, todayStart),
        lte(entries.completionDate, todayEnd),
      ),
    })

    if (existingEntry) {
      return res.status(409).json({
        error: 'Habit already completed today',
        message: 'You can only complete a habit once per day',
      })
    }

    const [entry] = await db
      .insert(entries)
      .values({ habitId: id, note })
      .returning()

    res.status(201).json({ message: 'Habit completed successfully', entry })
  } catch (error) {
    console.error('Complete habit error:', error)
    res.status(500).json({ error: 'Failed to complete habit' })
  }
}

export const getHabitStats = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, id), eq(habits.userId, userId)),
    })

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    const allEntries = await db.query.entries.findMany({
      where: eq(entries.habitId, id),
      orderBy: [desc(entries.completionDate)],
    })

    const totalCompletions = allEntries.length

    // Build a set of completed day strings (YYYY-MM-DD) for fast lookup
    const completedDays = new Set(
      allEntries.map((e) => e.completionDate.toISOString().split('T')[0]),
    )

    // Current streak: go backwards from today (or yesterday if not yet done today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const checkDate = new Date(today)
    if (!completedDays.has(todayStr)) {
      // Habit not completed today — start streak check from yesterday
      checkDate.setDate(checkDate.getDate() - 1)
    }

    let currentStreak = 0
    while (completedDays.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Longest streak: iterate through sorted unique days
    const sortedDays = [...completedDays].sort()
    let longestStreak = 0
    let runLength = 0

    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        runLength = 1
      } else {
        const prev = new Date(sortedDays[i - 1])
        const curr = new Date(sortedDays[i])
        const diffDays =
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        runLength = diffDays === 1 ? runLength + 1 : 1
      }
      longestStreak = Math.max(longestStreak, runLength)
    }

    // Completion percentage relative to expected completions based on frequency
    const daysSinceCreation =
      Math.floor(
        (today.getTime() - new Date(habit.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1

    let expectedCompletions: number
    switch (habit.frequency.toLowerCase()) {
      case 'weekly':
        expectedCompletions = Math.ceil(daysSinceCreation / 7)
        break
      case 'monthly':
        expectedCompletions = Math.ceil(daysSinceCreation / 30)
        break
      case 'daily':
      default:
        expectedCompletions = daysSinceCreation
    }

    const completionPercentage =
      expectedCompletions > 0
        ? Math.round((totalCompletions / expectedCompletions) * 1000) / 10
        : 0

    res.json({
      name: habit.name,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_completions: totalCompletions,
      completion_percentage: completionPercentage,
    })
  } catch (error) {
    console.error('Get habit stats error:', error)
    res.status(500).json({ error: 'Failed to fetch habit stats' })
  }
}
