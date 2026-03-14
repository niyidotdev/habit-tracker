import express from 'express'
import authRoutes from './routes/authRoutes.ts'
import userRoutes from './routes/userRoutes.ts'
import habitRoutes from './routes/habitRoutes.ts'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import { isTest } from '../env.ts'
import { errorHandler } from './middleware/errorHandler.ts'

const app = express()
app.use(helmet())
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://habit-tracker-wine-sigma.vercel.app',
    ],
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  morgan('dev', {
    skip: () => isTest(),
  }),
)

app.get('/health', (req, res) => {
  res.send('<button>Click me</button>')
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/habits', habitRoutes)

app.use(errorHandler)

export { app }
export default app
