import { Router } from 'express'
import { validateParams, validateBody } from '../middleware/validation.ts'
import z from 'zod'
import { authenticateToken } from '../middleware/auth.ts'
import {
  createHabit,
  getHabitById,
  getUserHabits,
  updateHabit,
  deleteHabit,
  completeHabit,
  getHabitStats,
} from '../controllers/habitController.ts'

const createHabitSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  frequency: z.string(),
  targetCount: z.number(),
  tagIds: z.array(z.string()).optional(),
})

const updateHabitSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  frequency: z.string().optional(),
  targetCount: z.number().optional(),
  isActive: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
})

const uuidSchema = z.object({
  id: z.string().uuid('Invalid habit ID format'),
})

const completeHabitBodySchema = z.object({
  note: z.string().optional(),
})

const router = Router()

router.use(authenticateToken)

router.get('/', getUserHabits)

router.get('/:id', validateParams(uuidSchema), getHabitById)

router.get('/:id/stats', validateParams(uuidSchema), getHabitStats)

router.post('/', validateBody(createHabitSchema), createHabit)

router.patch(
  '/:id',
  validateParams(uuidSchema),
  validateBody(updateHabitSchema),
  updateHabit,
)

router.delete('/:id', validateParams(uuidSchema), deleteHabit)

router.post(
  '/:id/complete',
  validateParams(uuidSchema),
  validateBody(completeHabitBodySchema),
  completeHabit,
)

export default router
