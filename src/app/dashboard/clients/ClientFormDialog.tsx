'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema, ClientSchemaType } from '@/lib/validations/clients.schema'
import { createClientAction } from '@/app/actions/clients.actions'
import { TravelerType } from '@prisma/client'
import { X, Loader2, Sparkles, User, Mail, Phone, Globe, CreditCard } from 'lucide-react'

export default function ClientFormDialog() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientSchemaType>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationality: '',
      passportNumber: '',
      passportExpiry: '',
      birthDate: '',
      travelerType: TravelerType.SOLO,
      tags: [],
      notes: '',
      documentFiles: [],
      preferences: {
        seatType: 'WINDOW',
        mealType: 'STANDARD',
        hotelChains: [],
        allergies: [],
      },
    },
  })

  const handleClose = () => {
    router.push('/dashboard/clients')
  }

  const onSubmit = (data: ClientSchemaType) => {
    setError('')
    startTransition(async () => {
      const res = await createClientAction(data)
      if (res.success) {
        router.push('/dashboard/clients')
        router.refresh()
      } else {
        setError(res.error || 'Ocurrió un error al guardar el pasajero.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog Body */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
          <h3 className="font-bold text-lg text-white">Registrar Nuevo Pasajero</h3>
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

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Nombre *</label>
              <input
                type="text"
                {...register('firstName')}
                placeholder="Ej. Juan"
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
              {errors.firstName && (
                <p className="text-[10px] text-red-400">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Apellido *</label>
              <input
                type="text"
                {...register('lastName')}
                placeholder="Ej. Pérez"
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
              {errors.lastName && (
                <p className="text-[10px] text-red-400">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Correo Electrónico *</label>
              <input
                type="email"
                {...register('email')}
                placeholder="Ej. juan.perez@email.com"
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
              {errors.email && (
                <p className="text-[10px] text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Teléfono</label>
              <input
                type="text"
                {...register('phone')}
                placeholder="Ej. +34 600 000 000"
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Nacionalidad y Tipo Viajero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Nacionalidad</label>
              <input
                type="text"
                {...register('nationality')}
                placeholder="Ej. Española"
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Tipo de Viajero</label>
              <select
                {...register('travelerType')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              >
                {Object.values(TravelerType).map((type) => (
                  <option key={type} value={type} className="bg-slate-900">
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pasaporte y Expiración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Número de Pasaporte</label>
              <input
                type="text"
                {...register('passportNumber')}
                placeholder="Ej. AA123456"
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Vencimiento Pasaporte</label>
              <input
                type="date"
                {...register('passportExpiry')}
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Notas / Comentarios</label>
            <textarea
              {...register('notes')}
              placeholder="Preferencias de hotel, alergias alimentarias, solicitudes especiales..."
              rows={3}
              className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
            />
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
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>Guardar Pasajero</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
