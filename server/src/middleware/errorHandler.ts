import type { Request, Response, NextFunction } from 'express'
import env from '../../env.ts'

class APIError extends Error {
  status: number
  name: string
  message: string
  constructor(name: string, message: string, status: number) {
    super()
    this.message = message
    this.status = status
    this.name = name
  }
}

export const errorHandler = (
  err: APIError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err.stack)
  let status = err.status || 500
  let message = err.message || 'Internal Server Error'

  if (err.name === 'ValidationError') {
    status = 400
    message = 'Validation Error'
  }

  if (err.name === 'UnauthorizedError') {
    status = 401
    message = 'Unauthorized'
  }

  res.status(status).json({
    error: message,
    ...(env.APP_STAGE === 'dev' && {
      stack: err.stack,
      details: err.message,
    }),
  })
}
