'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRoleAction, toggleUserStatusAction } from '@/app/actions/users.actions'
import { Role } from '@prisma/client'
import { Loader2, ShieldAlert, ShieldCheck, UserMinus, UserCheck } from 'lucide-react'

interface UserRowActionsProps {
  userId: string
  currentRole: Role
  isActive: boolean
  isSelf: boolean
}

export default function UserRowActions({ userId, currentRole, isActive, isSelf }: UserRowActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleRoleChange = (newRole: Role) => {
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || 'Error al cambiar de rol.')
      }
    })
  }

  const handleToggleStatus = () => {
    startTransition(async () => {
      const res = await toggleUserStatusAction(userId, !isActive)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || 'Error al modificar el estado de la cuenta.')
      }
    })
  }

  return (
    <div className="flex items-center gap-3 justify-end text-xs">
      {isPending && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}

      {/* Role Selector */}
      <select
        value={currentRole}
        disabled={isPending || isSelf}
        onChange={(e) => handleRoleChange(e.target.value as Role)}
        className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
      >
        <option value={Role.AGENT}>AGENT</option>
        <option value={Role.MANAGER}>MANAGER</option>
        <option value={Role.ADMIN}>ADMIN</option>
      </select>

      {/* Status Toggle Button (Soft Delete) */}
      {!isSelf && (
        <button
          onClick={handleToggleStatus}
          disabled={isPending}
          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition ${
            isActive
              ? 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
          }`}
          title={isActive ? 'Desactivar Cuenta' : 'Activar Cuenta'}
        >
          {isActive ? (
            <>
              <UserMinus className="h-3.5 w-3.5" />
              <span>Desactivar</span>
            </>
          ) : (
            <>
              <UserCheck className="h-3.5 w-3.5" />
              <span>Activar</span>
            </>
          )}
        </button>
      )}

      {isSelf && (
        <span className="text-[10px] text-slate-500 italic px-2">
          Tu cuenta activa
        </span>
      )}
    </div>
  )
}
