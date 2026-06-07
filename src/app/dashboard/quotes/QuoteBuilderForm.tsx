'use client'

import { useTransition, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { quoteSchema, QuoteSchemaType } from '@/lib/validations/quotes.schema'
import { createQuoteAction } from '@/app/actions/quotes.actions'
import { QuoteItemType } from '@prisma/client'
import { Plus, Trash2, Calendar, DollarSign, Loader2, Compass, Layers, Save, Tag } from 'lucide-react'

// Simple client-side converter values for instant feedback
const CONVERSION_ESTIMATES: Record<string, number> = {
  'USD': 1.0,
  'EUR': 1.09, // 1 EUR = 1.09 USD
  'MXN': 0.057, // 1 MXN = 0.057 USD
}

interface OpportunityOption {
  id: string
  title: string
  clientId: string
  estimatedValue: number
  client: {
    firstName: string
    lastName: string
  }
}

interface ProviderOption {
  id: string
  name: string
  type: string
}

interface QuoteBuilderFormProps {
  opportunities: OpportunityOption[]
  providers: ProviderOption[]
  preselectedOppId?: string
}

export default function QuoteBuilderForm({
  opportunities,
  providers,
  preselectedOppId = '',
}: QuoteBuilderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [estimatedTotal, setEstimatedTotal] = useState(0)

  // Find preselected opportunity to pre-populate client
  const initialOpp = opportunities.find((o) => o.id === preselectedOppId) || opportunities[0]

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<QuoteSchemaType>({
    resolver: zodResolver(quoteSchema) as any,
    defaultValues: {
      opportunityId: preselectedOppId || opportunities[0]?.id || '',
      clientId: initialOpp?.clientId || '',
      agentId: '', // Set by Server Action/context
      status: 'DRAFT',
      validUntil: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
      totalAmount: 0,
      currency: 'USD',
      items: [
        {
          type: 'FLIGHT',
          description: '',
          quantity: 1,
          unitPrice: 0,
          currency: 'USD',
          providerId: '',
          providerRef: '',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Arribo al Destino',
          description: 'Llegada, check-in en el hotel y resto del día libre.',
          activities: [],
        },
      ],
    },
  })

  // Watch opportunity change to update clientId
  const watchedOppId = useWatch({ control, name: 'opportunityId' })

  useEffect(() => {
    if (watchedOppId) {
      const opp = opportunities.find((o) => o.id === watchedOppId)
      if (opp) {
        setValue('clientId', opp.clientId)
      }
    }
  }, [watchedOppId, setValue, opportunities])

  // Field Arrays for Items and Itinerary
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: 'items',
  })

  const {
    fields: itineraryFields,
    append: appendDay,
    remove: removeDay,
  } = useFieldArray({
    control,
    name: 'itinerary',
  })

  // Watch values for real-time total calculator
  const watchedItems = useWatch({ control, name: 'items' })
  const watchedBaseCurrency = useWatch({ control, name: 'currency' })

  useEffect(() => {
    if (!watchedItems) return

    let total = 0
    watchedItems.forEach((item) => {
      if (!item) return
      const qty = item.quantity || 0
      const price = item.unitPrice || 0
      const currency = item.currency || 'USD'

      // Convert to USD first
      const rateToUSD = CONVERSION_ESTIMATES[currency] || 1.0
      const priceInUSD = price * qty * rateToUSD

      // Convert USD to base target currency
      const rateFromUSD = 1 / (CONVERSION_ESTIMATES[watchedBaseCurrency] || 1.0)
      total += priceInUSD * rateFromUSD
    })

    setEstimatedTotal(total)
  }, [watchedItems, watchedBaseCurrency])

  const onSubmit = (data: QuoteSchemaType) => {
    setError('')
    startTransition(async () => {
      // Find active opportunity agent
      const opp = opportunities.find((o) => o.id === data.opportunityId)
      if (!opp) {
        setError('Oportunidad inválida.')
        return
      }

      // We assign agentId on the server, but let's mock it for validation completeness
      const completeData = {
        ...data,
        agentId: 'mock-agent-id', // overridden on backend
        totalAmount: estimatedTotal,
      }

      const res = await createQuoteAction(completeData as any)
      if (res.success) {
        router.push('/dashboard/quotes')
        router.refresh()
      } else {
        setError(res.error || 'Ocurrió un error al guardar la cotización.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Main card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <h3 className="font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Compass className="h-5 w-5 text-blue-400" />
          <span>Información General de la Propuesta</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Opportunity Link */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Trato / Oportunidad *</label>
            <select
              {...register('opportunityId')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
            >
              {opportunities.map((o) => (
                <option key={o.id} value={o.id} className="bg-slate-900">
                  {o.title} ({o.client.firstName} {o.client.lastName})
                </option>
              ))}
            </select>
          </div>

          {/* Valid until */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Fecha de Vencimiento de Oferta *</label>
            <input
              type="date"
              {...register('validUntil')}
              className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Target Currency */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Moneda de la Cotización *</label>
            <select
              {...register('currency')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
            >
              <option value="USD">Dólares Americanos (USD)</option>
              <option value="EUR">Euros (EUR)</option>
              <option value="MXN">Pesos Mexicanos (MXN)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing Items Builder */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <span>Ítems y Segmentos de Precio</span>
          </h3>
          <button
            type="button"
            onClick={() =>
              appendItem({
                type: 'HOTEL',
                description: '',
                quantity: 1,
                unitPrice: 0,
                currency: 'USD',
                providerId: '',
                providerRef: '',
              })
            }
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Agregar Ítem</span>
          </button>
        </div>

        {errors.items && (
          <p className="text-[10px] text-red-400">{errors.items.message}</p>
        )}

        <div className="space-y-4">
          {itemFields.map((field, index) => (
            <div
              key={field.id}
              className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end relative"
            >
              {/* Type */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tipo</label>
                <select
                  {...register(`items.${index}.type` as const)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-2 text-xs text-white focus:outline-none"
                >
                  {Object.values(QuoteItemType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="sm:col-span-4 space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Descripción *</label>
                <input
                  type="text"
                  required
                  {...register(`items.${index}.description` as const)}
                  placeholder="Ej. Hotel DoubleTree París 4 noches"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none placeholder-slate-700"
                />
              </div>

              {/* Quantity */}
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Cant.</label>
                <input
                  type="number"
                  required
                  min="1"
                  {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg py-2 px-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Price */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">P. Unitario *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                  placeholder="0.00"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg py-2 px-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Currency */}
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Moneda</label>
                <select
                  {...register(`items.${index}.currency` as const)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-1 text-xs text-white focus:outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="MXN">MXN</option>
                </select>
              </div>

              {/* Provider */}
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Proveedor</label>
                <select
                  {...register(`items.${index}.providerId` as const)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-1 text-xs text-white focus:outline-none"
                >
                  <option value="">Ninguno</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delete button */}
              <div className="sm:col-span-1 flex justify-center pb-1">
                {itemFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-slate-500 hover:text-red-400 bg-slate-900/65 rounded-lg border border-slate-800/80 hover:border-red-500/20"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Estimation summary */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/20 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-bold uppercase">Total Estimado Propuesto</span>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-400">
              {watchedBaseCurrency} ${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[9px] text-slate-500 mt-0.5">Calculado en tiempo real con cotización demo.</p>
          </div>
        </div>
      </div>

      {/* Itinerary Planner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-400" />
            <span>Planificador de Itinerario</span>
          </h3>
          <button
            type="button"
            onClick={() =>
              appendDay({
                day: itineraryFields.length + 1,
                title: '',
                description: '',
                activities: [],
              })
            }
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Agregar Día</span>
          </button>
        </div>

        <div className="space-y-4">
          {itineraryFields.map((field, index) => (
            <div
              key={field.id}
              className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3 relative"
            >
              {/* Day Badge */}
              <div className="flex justify-between items-center">
                <span className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  Día {index + 1}
                </span>

                {itineraryFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDay(index)}
                    className="text-xs text-slate-500 hover:text-red-400"
                  >
                    Eliminar día
                  </button>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Título del Día *</label>
                <input
                  type="text"
                  required
                  {...register(`itinerary.${index}.title` as const)}
                  placeholder="Ej. Llegada a París y traslado"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none placeholder-slate-700"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Descripción *</label>
                <textarea
                  required
                  rows={2}
                  {...register(`itinerary.${index}.description` as const)}
                  placeholder="Detalla las actividades y cronograma de este día de viaje..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none placeholder-slate-700 resize-none"
                />
              </div>

              <input type="hidden" {...register(`itinerary.${index}.day` as const)} value={index + 1} />
            </div>
          ))}
        </div>

        {/* Submit Actions */}
        <div className="pt-4 flex gap-3 justify-end">
          <Link
            href="/dashboard/quotes"
            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Registrando cotización...</span>
              </>
            ) : (
              <>
                <Save className="h-4.5 w-4.5" />
                <span>Generar Propuesta y PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
