import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Sparkles, Loader2, ArrowRight, User, Mail, Lock, AtSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { registerUser } from '../lib/api'
import clsx from 'clsx'

interface FormFields {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function FieldWrapper({
  label,
  htmlFor,
  icon,
  error,
  children,
}: {
  label: string
  htmlFor: string
  icon: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="label flex items-center gap-1.5">
        <span className="text-slate-400">{icon}</span>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-rose-500 mt-0.5">{error}</p>
      )}
    </div>
  )
}

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [fields, setFields] = useState<FormFields>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const set = (field: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const next: FormErrors = {}

    if (!fields.username.trim()) {
      next.username = 'Username is required.'
    } else if (fields.username.length < 3) {
      next.username = 'Username must be at least 3 characters.'
    } else if (!/^[a-zA-Z0-9_]+$/.test(fields.username)) {
      next.username = 'Only letters, numbers, and underscores allowed.'
    }

    if (!fields.email.trim()) {
      next.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      next.email = 'Please enter a valid email address.'
    }

    if (!fields.password) {
      next.password = 'Password is required.'
    } else if (fields.password.length < 8) {
      next.password = 'Password must be at least 8 characters.'
    } else if (!/[A-Z]/.test(fields.password)) {
      next.password = 'Password must contain at least one uppercase letter.'
    } else if (!/[0-9]/.test(fields.password)) {
      next.password = 'Password must contain at least one number.'
    }

    if (!fields.confirmPassword) {
      next.confirmPassword = 'Please confirm your password.'
    } else if (fields.confirmPassword !== fields.password) {
      next.confirmPassword = 'Passwords do not match.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  // ─── Password strength ─────────────────────────────────────────────────────
  const getStrength = (): { level: number; label: string; color: string } => {
    const p = fields.password
    if (!p) return { level: 0, label: '', color: '' }
    let score = 0
    if (p.length >= 8) score++
    if (p.length >= 12) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^a-zA-Z0-9]/.test(p)) score++

    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-rose-400' }
    if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-400' }
    if (score <= 3) return { level: 3, label: 'Good', color: 'bg-blue-400' }
    return { level: 4, label: 'Strong', color: 'bg-emerald-400' }
  }

  const strength = getStrength()

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const data = await registerUser({
        email: fields.email.trim(),
        username: fields.username.trim(),
        password: fields.password,
        firstName: fields.firstName.trim() || undefined,
        lastName: fields.lastName.trim() || undefined,
      })
      login(data.user, data.token)
      toast.success(
        `Welcome to Habitual, ${data.user.firstName ?? data.user.username}! 🎉`,
        { duration: 4000 },
      )
      navigate('/dashboard')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error

      if (status === 409) {
        if (message?.toLowerCase().includes('email')) {
          setErrors((p) => ({ ...p, email: 'This email is already registered.' }))
          toast.error('Email already in use.')
        } else if (message?.toLowerCase().includes('username')) {
          setErrors((p) => ({ ...p, username: 'This username is already taken.' }))
          toast.error('Username already taken.')
        } else {
          toast.error('Account already exists.')
        }
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
        className="pointer-events-none fixed top-[-10%] right-[-5%] w-[450px] h-[450px]
                   rounded-full bg-violet-200/40 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed bottom-[-15%] left-[-5%] w-[400px] h-[400px]
                   rounded-full bg-indigo-200/40 blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="card shadow-soft px-8 pt-8 pb-10 flex flex-col gap-7">

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
                Start your journey
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Create your free account and build habits that stick.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

            {/* First + Last name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="firstName" className="label flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  First name
                  <span className="text-slate-300 text-xs font-normal">(optional)</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className="input-field"
                  placeholder="Jane"
                  value={fields.firstName}
                  onChange={set('firstName')}
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lastName" className="label flex items-center gap-1.5">
                  <span className="text-slate-400 w-3.5 h-3.5" />
                  Last name
                  <span className="text-slate-300 text-xs font-normal">(optional)</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className="input-field"
                  placeholder="Doe"
                  value={fields.lastName}
                  onChange={set('lastName')}
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>
            </div>

            {/* Username */}
            <FieldWrapper
              label="Username"
              htmlFor="username"
              icon={<AtSign className="w-3.5 h-3.5" />}
              error={errors.username}
            >
              <input
                id="username"
                type="text"
                autoComplete="username"
                className={clsx(
                  'input-field',
                  errors.username && 'border-rose-300 bg-rose-50 focus:ring-rose-400',
                )}
                placeholder="janedoe"
                value={fields.username}
                onChange={set('username')}
                disabled={isLoading}
                maxLength={50}
              />
            </FieldWrapper>

            {/* Email */}
            <FieldWrapper
              label="Email address"
              htmlFor="email"
              icon={<Mail className="w-3.5 h-3.5" />}
              error={errors.email}
            >
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={clsx(
                  'input-field',
                  errors.email && 'border-rose-300 bg-rose-50 focus:ring-rose-400',
                )}
                placeholder="jane@example.com"
                value={fields.email}
                onChange={set('email')}
                disabled={isLoading}
              />
            </FieldWrapper>

            {/* Password */}
            <FieldWrapper
              label="Password"
              htmlFor="password"
              icon={<Lock className="w-3.5 h-3.5" />}
              error={errors.password}
            >
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={clsx(
                    'input-field pr-11',
                    errors.password && 'border-rose-300 bg-rose-50 focus:ring-rose-400',
                  )}
                  placeholder="••••••••"
                  value={fields.password}
                  onChange={set('password')}
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {fields.password.length > 0 && (
                <div className="flex flex-col gap-1 mt-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div
                        key={lvl}
                        className={clsx(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          lvl <= strength.level ? strength.color : 'bg-slate-100',
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Strength:{' '}
                    <span
                      className={clsx(
                        'font-medium',
                        strength.level <= 1 && 'text-rose-500',
                        strength.level === 2 && 'text-amber-500',
                        strength.level === 3 && 'text-blue-500',
                        strength.level === 4 && 'text-emerald-500',
                      )}
                    >
                      {strength.label}
                    </span>
                  </p>
                </div>
              )}
            </FieldWrapper>

            {/* Confirm password */}
            <FieldWrapper
              label="Confirm password"
              htmlFor="confirmPassword"
              icon={<Lock className="w-3.5 h-3.5" />}
              error={errors.confirmPassword}
            >
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={clsx(
                    'input-field pr-11',
                    errors.confirmPassword &&
                      'border-rose-300 bg-rose-50 focus:ring-rose-400',
                    !errors.confirmPassword &&
                      fields.confirmPassword &&
                      fields.confirmPassword === fields.password &&
                      'border-emerald-300 focus:ring-emerald-400',
                  )}
                  placeholder="••••••••"
                  value={fields.confirmPassword}
                  onChange={set('confirmPassword')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                             hover:text-slate-600 transition-colors p-0.5"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FieldWrapper>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 mt-1 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating your account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Terms note */}
            <p className="text-center text-xs text-slate-400 leading-relaxed">
              By creating an account you agree to our{' '}
              <span className="text-violet-500 font-medium">Terms of Service</span>{' '}
              and{' '}
              <span className="text-violet-500 font-medium">Privacy Policy</span>.
            </p>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 -mt-1">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-slate-500 -mt-3">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-violet-600 hover:text-violet-700
                         transition-colors underline underline-offset-2"
            >
              Sign in instead
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Your data is private and never shared.
        </p>
      </div>
    </div>
  )
}
