'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth.actions'
import {
  Plane,
  LayoutDashboard,
  Users,
  Kanban,
  FileText,
  Briefcase,
  LogOut,
  Menu,
  X,
  Bell,
  User as UserIcon,
  Shield,
} from 'lucide-react'

// Defined types for active user
interface UserProfile {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'AGENT'
}

interface DashboardLayoutClientProps {
  children: React.ReactNode
  user: UserProfile | null
}

export default function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Dynamically build navItems based on user role
  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/dashboard/clients', label: 'Clientes (Fichas)', icon: Users },
    { href: '/dashboard/opportunities', label: 'Oportunidades (Kanban)', icon: Kanban },
    { href: '/dashboard/quotes', label: 'Cotizador', icon: FileText },
    { href: '/dashboard/bookings', label: 'Operaciones y Liquidaciones', icon: Briefcase },
  ]

  // Only show User Management tab to ADMIN and MANAGER
  if (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
    navItems.push({ href: '/dashboard/users', label: 'Usuarios y Permisos', icon: Shield })
  }

  const handleLogout = () => {
    startTransition(async () => {
      const res = await logoutAction()
      if (res.success) {
        router.refresh()
        router.push('/login')
      }
    })
  }

  // Display user role label
  const getRoleLabel = (role?: string) => {
    if (role === 'ADMIN') return 'Administrador'
    if (role === 'MANAGER') return 'Gerente'
    return 'Asesor de Ventas'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 border-r border-slate-800 shrink-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center">
            <Plane className="h-5 w-5 text-white rotate-45" />
          </div>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            Antigravity CRM
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/15 border border-blue-500/20 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Header and Mobile Drawer container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-200 focus:outline-none"
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="hidden md:block text-xl font-bold tracking-tight text-white capitalize">
              {navItems.find((item) => item.href === pathname)?.label || 'CRM Portal'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              className="p-2 text-slate-400 hover:text-slate-200 relative bg-slate-800/40 border border-slate-800 rounded-xl hover:border-slate-700 transition"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            </button>

            {/* Profile Dropdown indicator */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="h-8 w-8 rounded-full bg-indigo-600/35 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-white">{user?.name || 'Asesor Demo'}</p>
                <p className="text-[10px] text-slate-400">{getRoleLabel(user?.role)}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer (Overlay Modal) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar drawer content */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 border-r border-slate-800 animate-slide-in">
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Plane className="h-4.5 w-4.5 text-white rotate-45" />
                  </div>
                  <span className="font-bold text-base text-white">Antigravity CRM</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-white"
                  aria-label="Cerrar menú"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600/15 border border-blue-500/20 text-blue-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Main Content area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
