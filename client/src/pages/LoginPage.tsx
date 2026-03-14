import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { loginUser } from '../lib/api'
import clsx from 'clsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  // ─── Client-side validation ────────────────────────────────────────────────
  const validate = (): boolean => {
    const next: typeof errors = {}
    if (!email.trim()) {
      next.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Please enter a valid email address.'
    }
    if (!password) {
      next.password = 'Password is required.'
    } else if (password.length < 6) {
      next.password = 'Password must be at least 6 characters.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const data = await loginUser({ email: email.trim(), password })
      login(data.user, data.token)
      toast.success(`Welcome back, ${data.user.firstName ?? data.user.username}! 👋`)
      navigate('/dashboard')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        toast.error('Incorrect email or password.')
        setErrors({ email: ' ', password: 'Incorrect email or password.' })
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div
        className="pointer-events-none fixed top-[-10%] left-[-5%] w-[500px] h-[500px]
                   rounded-full bg-violet-200/40 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed bottom-[-10%] right-[-5%] w-[400px] h-[400px]
                   rounded-full bg-indigo-200/40 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="card shadow-soft px-8 pt-8 pb-10 flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className="w-12 h-12 rounded-2xl bg-violet-gradient flex items-center
                         justify-center shadow-glow"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Sign in to track your habits and keep your streaks alive.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={clsx(
                  'input-field',
                  errors.email?.trim() &&
                    'border-rose-300 bg-rose-50 focus:ring-rose-400',
                )}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
                }}
                disabled={isLoading}
              />
              {errors.email?.trim() && (
                <p className="text-xs text-rose-500 mt-0.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={clsx(
                    'input-field pr-11',
                    errors.password?.trim() &&
                      'border-rose-300 bg-rose-50 focus:ring-rose-400',
                  )}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                  }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                             hover:text-slate-600 transition-colors p-0.5"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password?.trim() && (
                <p className="text-xs text-rose-500 mt-0.5">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 mt-1 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-slate-500 -mt-4">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-violet-600 hover:text-violet-700
                         transition-colors underline underline-offset-2"
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Below-card note */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Your data is private and never shared.
        </p>
      </div>
    </div>
  )
}
