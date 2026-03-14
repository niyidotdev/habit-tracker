import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Sparkles,
  User,
  Settings,
  X,
  Menu,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import clsx from 'clsx'

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div
        className="w-8 h-8 rounded-xl bg-violet-gradient flex items-center justify-center
                   shadow-sm shrink-0"
        aria-hidden="true"
      >
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="leading-none">
        <span className="font-bold text-slate-800 text-base tracking-tight">
          Habitual
        </span>
        <span className="block text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
          Build better habits
        </span>
      </div>
    </div>
  )
}

// ─── Nav items config ─────────────────────────────────────────────────────────

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    end: true,
  },
]

// ─── User card ────────────────────────────────────────────────────────────────

function UserCard({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)

  const displayName =
    user?.firstName
      ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
      : user?.username ?? 'User'

  const initials =
    user?.firstName
      ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
      : (user?.username?.[0] ?? 'U').toUpperCase()

  return (
    <div className="mt-auto border-t border-slate-100 pt-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className={clsx(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
          expanded ? 'bg-slate-100' : 'hover:bg-slate-50',
        )}
        aria-expanded={expanded}
        aria-label="User menu"
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-xl bg-violet-gradient flex items-center justify-center
                     shrink-0 text-white text-xs font-bold shadow-sm select-none"
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0 text-left leading-tight">
          <p className="text-sm font-semibold text-slate-700 truncate">
            {displayName}
          </p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>

        <ChevronDown
          className={clsx(
            'w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {/* Expanded user actions */}
      {expanded && (
        <div className="mt-1 flex flex-col gap-0.5 animate-slide-up">
          <button
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-500
                       hover:bg-slate-50 hover:text-slate-700 transition-colors text-left"
            onClick={() => setExpanded(false)}
          >
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Profile
            <span className="ml-auto text-[10px] font-medium text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded-md">
              soon
            </span>
          </button>

          <button
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-500
                       hover:bg-slate-50 hover:text-slate-700 transition-colors text-left"
            onClick={() => setExpanded(false)}
          >
            <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Settings
            <span className="ml-auto text-[10px] font-medium text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded-md">
              soon
            </span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-500
                       hover:bg-rose-50 transition-colors text-left"
            onClick={onLogout}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sidebar inner content (shared between desktop + mobile) ──────────────────

interface SidebarContentProps {
  onClose?: () => void
}

function SidebarContent({ onClose }: SidebarContentProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full px-3 py-4 gap-4">
      {/* Logo */}
      <div className="flex items-center justify-between px-1 mb-1">
        <Logo />
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600
                       hover:bg-slate-100 transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5" aria-label="Main navigation">
        <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
          Menu
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-150 group',
                isActive
                  ? 'bg-violet-100 text-violet-700 shadow-glow'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'shrink-0 transition-transform duration-150',
                    !isActive && 'group-hover:scale-110',
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Motivational quote card */}
      <div className="rounded-2xl bg-violet-gradient p-4 flex flex-col gap-2 mt-1">
        <span className="text-xl leading-none" aria-hidden="true">
          🌱
        </span>
        <p className="text-xs text-violet-100 leading-relaxed">
          "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
        </p>
        <p className="text-[10px] font-semibold text-violet-300 tracking-wide">
          — Aristotle
        </p>
      </div>

      {/* User card / logout — pushed to bottom */}
      <UserCard onLogout={handleLogout} />
    </div>
  )
}

// ─── Mobile hamburger button ──────────────────────────────────────────────────

interface MobileMenuButtonProps {
  onClick: () => void
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700
                 hover:bg-white/80 transition-all duration-150 shadow-card bg-white"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}

// ─── Main Sidebar export ──────────────────────────────────────────────────────

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0
                   bg-white/80 backdrop-blur-sm border-r border-slate-100"
        aria-label="Sidebar"
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar (slide-in drawer) ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-soft
                       flex flex-col lg:hidden animate-slide-up"
            style={{ animationName: 'slideIn' }}
            aria-label="Mobile sidebar"
          >
            <SidebarContent onClose={onMobileClose} />
          </aside>
        </>
      )}
    </>
  )
}
