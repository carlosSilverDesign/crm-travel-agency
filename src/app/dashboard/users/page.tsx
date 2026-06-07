export const dynamic = 'force-dynamic'

import { getUsers } from '@/modules/users/queries'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  ArrowLeft,
  Mail,
  Shield,
  Briefcase,
  DollarSign,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import UserFormDialog from './UserFormDialog'
import UserRowActions from './UserRowActions'

interface PageProps {
  searchParams: Promise<{
    invite?: string
  }>
}

export default async function UsersManagementPage({ searchParams }: PageProps) {
  const params = await searchParams
  const showInvite = params.invite === 'true'

  // 1. Validar accesos jerárquicos (RBAC)
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 shadow-lg">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Acceso Denegado</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          No tienes privilegios administrativos para acceder a la gestión de usuarios de la agencia.
        </p>
        <Link
          href="/dashboard"
          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl px-5 py-2.5 text-xs font-semibold transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    )
  }

  // 2. Obtener la lista de usuarios y calcular métricas
  const usersRes = await getUsers()
  const users = usersRes.success && usersRes.data ? usersRes.data : []

  const totalUsers = users.length
  const activeAgents = users.filter((u) => u.role === 'AGENT' && u.isActive).length
  const activeManagers = users.filter((u) => u.role === 'MANAGER' && u.isActive).length
  const inactiveUsers = users.filter((u) => !u.isActive).length

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <p className="text-sm text-slate-400">
            Administra el personal, asigna roles de acceso y audita las bolsas de clientes
          </p>
        </div>

        <Link
          href="?invite=true"
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
        >
          <UserPlus className="h-4.5 w-4.5" />
          <span>Invitar Asesor</span>
        </Link>
      </div>

      {/* Team Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Equipo</p>
            <p className="text-lg font-black text-white mt-0.5">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Asesores Activos</p>
            <p className="text-lg font-black text-white mt-0.5">{activeAgents}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Managers Activos</p>
            <p className="text-lg font-black text-white mt-0.5">{activeManagers}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cuentas Inactivas</p>
            <p className="text-lg font-black text-white mt-0.5">{inactiveUsers}</p>
          </div>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40">
          <h3 className="font-bold text-base text-white">Miembros de la Organización</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/20">
                <th className="p-4 pl-6">Asesor / Counter</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Estado Acceso</th>
                <th className="p-4">Bolsa Clientes</th>
                <th className="p-4">LTV Cartera</th>
                <th className="p-4 pr-6 text-right">Configuración y Permisos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-slate-800/20 transition ${!user.isActive ? 'opacity-50' : ''}`}>
                  {/* Name and email */}
                  <td className="p-4 pl-6">
                    <div className="font-bold text-slate-200">{user.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Mail className="h-3 w-3 text-slate-600" />
                      <span>{user.email}</span>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[9px] border uppercase tracking-wider ${
                        user.role === 'ADMIN'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : user.role === 'MANAGER'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Account state */}
                  <td className="p-4">
                    {user.isActive ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[10px]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Activo</span>
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1 font-semibold text-[10px]">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Inactivo</span>
                      </span>
                    )}
                  </td>

                  {/* Assigned client counts */}
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-slate-300 font-medium">
                      <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                      <span>{user.clientCount} Clientes</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {user.oppCount} Oportunidades
                    </div>
                  </td>

                  {/* LTV of portfolio */}
                  <td className="p-4 font-bold text-slate-200">
                    <span className="flex items-center text-slate-200">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-500/80 -mr-0.5" />
                      <span>{user.portfolioLtv.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </span>
                  </td>

                  {/* CRUD Actions */}
                  <td className="p-4 pr-6 text-right">
                    <UserRowActions
                      userId={user.id}
                      currentRole={user.role}
                      isActive={user.isActive}
                      isSelf={user.id === currentUser.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal Overlay */}
      {showInvite && (
        <UserFormDialog />
      )}
    </div>
  )
}
