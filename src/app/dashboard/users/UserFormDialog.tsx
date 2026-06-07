'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userCreateSchema, UserCreateSchemaType } from '@/lib/validations/users.schema'
import { createUserAction } from '@/app/actions/users.actions'
import { Role } from '@prisma/client'
import { X, Loader2, UserPlus, Shield, Mail, Key } from 'lucide-react'

export default function UserFormDialog() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserCreateSchemaType>({
    resolver: zodResolver(userCreateSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      role: Role.AGENT,
      password: '',
    },
  })

  const handleClose = () => {
    router.push('/dashboard/users')
  }

  const onSubmit = (data: UserCreateSchemaType) => {
    setError('')
    startTransition(async () => {
      const res = await createUserAction(data)
      if (res.success) {
        handleClose()
        router.refresh()
      } else {
        setError(res.error || 'Ocurrió un error al registrar el usuario.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog Body */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-400" />
            <span>Invitar Asesor / Counter</span>
          </h3>
          <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Nombre Completo *</label>
            <input
              type="text"
              {...register('name')}
              placeholder="Ej. Sofía Rodríguez"
              className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
            {errors.name && (
              <p className="text-[10px] text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Correo Electrónico *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                {...register('email')}
                placeholder="sofia@agencia.com"
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            {errors.email && (
              <p className="text-[10px] text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Rol y Permisos</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <select
                {...register('role')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value={Role.AGENT} className="bg-slate-900">Asesor de Ventas (AGENT)</option>
                <option value={Role.MANAGER} className="bg-slate-900">Gerente Operativo (MANAGER)</option>
                <option value={Role.ADMIN} className="bg-slate-900">Administrador General (ADMIN)</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Contraseña Temporal (Opcional)</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                {...register('password')}
                placeholder="Mínimo 6 caracteres (ej. Temp123*)"
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            {errors.password && (
              <p className="text-[10px] text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex gap-3 justify-end border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <span>Registrar Counter</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
