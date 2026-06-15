'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { opportunitySchema, OpportunitySchemaType } from '@/lib/validations/opportunities.schema'
import { createOpportunityAction } from '@/app/actions/opportunities.actions'
import { OpportunityStage, OpportunitySource } from '@prisma/client'
import { X, Loader2, Target, DollarSign, Users, Info } from 'lucide-react'

interface ClientOption {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface OpportunityFormDialogProps {
  clients: ClientOption[]
  agentId: string
}

export default function OpportunityFormDialog({ clients, agentId }: OpportunityFormDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OpportunitySchemaType>({
    resolver: zodResolver(opportunitySchema) as any,
    defaultValues: {
      title: '',
      clientId: clients[0]?.id || '',
      agentId: agentId,
      stage: OpportunityStage.PROSPECT,
      estimatedValue: 0,
      currency: 'USD',
      probability: 10,
      closeDate: null,
      source: OpportunitySource.WEB,
      notes: '',
    },
  })

  const handleClose = () => {
    router.push('/dashboard/opportunities')
  }

  const onSubmit = (data: OpportunitySchemaType) => {
    setError('')
    startTransition(async () => {
      const res = await createOpportunityAction(data)
      if (res.success) {
        router.push('/dashboard/opportunities')
        router.refresh()
      } else {
        setError(res.error || 'Ocurrió un error al registrar la oportunidad.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog Body */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-400" />
            <span>Crear Oportunidad de Venta</span>
          </h3>
          <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg">
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

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Título del Trato *</label>
            <input
              type="text"
              {...register('title')}
              placeholder="Ej. Paquete Familia Disney o Aéreos Madrid"
              className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
            />
            {errors.title && (
              <p className="text-[10px] text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Client Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Pasajero Relacionado *</label>
            <select
              {...register('clientId')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  {c.firstName} {c.lastName} ({c.email})
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="text-[10px] text-red-400">{errors.clientId.message}</p>
            )}
          </div>

          {/* Value and Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Valor Estimado ($ USD) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="number"
                  {...register('estimatedValue', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              {errors.estimatedValue && (
                <p className="text-[10px] text-red-400">{errors.estimatedValue.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Canal de Origen</label>
              <select
                {...register('source')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
              >
                {Object.values(OpportunitySource).map((src) => (
                  <option key={src} value={src} className="bg-slate-900">
                    {src === 'WEB' ? 'Página Web' : src === 'SOCIAL' ? 'Redes Sociales' : src === 'REFERRAL' ? 'Recomendación' : src === 'WALK_IN' ? 'Oficina' : 'Cliente Frecuente'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Notas de la Oportunidad</label>
            <textarea
              {...register('notes')}
              placeholder="Detalles sobre destinos de interés, vuelos preferidos, aerolíneas o cotizaciones pendientes..."
              rows={3}
              className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          <input type="hidden" {...register('agentId')} value={agentId} />

          {/* Submit Actions */}
          <div className="pt-4 flex gap-3 justify-end border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
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
                  <span>Registrar Oportunidad</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
