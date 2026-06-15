'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createIncidentAction, resolveIncidentAction } from '@/app/actions/bookings.actions'
import { IncidentPriority, IncidentStatus } from '@prisma/client'
import { AlertTriangle, CheckCircle, Plus, Info, AlertOctagon, HelpCircle, Loader2 } from 'lucide-react'

// Severity and priority configs
const PRIORITY_CONFIG: Record<IncidentPriority, { label: string; bg: string; text: string }> = {
  LOW: { label: 'Baja', bg: 'bg-slate-800', text: 'text-slate-400' },
  MEDIUM: { label: 'Media', bg: 'bg-blue-500/10 border border-blue-500/20', text: 'text-blue-400' },
  HIGH: { label: 'Alta', bg: 'bg-amber-500/10 border border-amber-500/20', text: 'text-amber-400' },
  CRITICAL: { label: 'Crítica', bg: 'bg-red-500/10 border border-red-500/20', text: 'text-red-400 animate-pulse' },
}

interface IncidentItem {
  id: string
  bookingId: string
  type: string
  description: string
  status: IncidentStatus
  priority: IncidentPriority
  createdAt: Date
  booking: {
    client: {
      firstName: string
      lastName: string
      phone: string | null
    }
  }
}

interface BookingOption {
  id: string
  confirmationCode: string | null
  client: {
    firstName: string
    lastName: string
  }
}

interface IncidentsBoardProps {
  initialIncidents: IncidentItem[]
  bookings: BookingOption[]
}

export default function IncidentsBoard({ initialIncidents, bookings }: IncidentsBoardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [incidents, setIncidents] = useState<IncidentItem[]>(initialIncidents)
  
  // Resolution form states
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolutionText, setResolutionText] = useState('')

  // Report new incident form states
  const [showReportForm, setShowReportForm] = useState(false)
  const [newBookingId, setNewBookingId] = useState(bookings[0]?.id || '')
  const [newType, setNewType] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<IncidentPriority>('MEDIUM')
  const [formError, setFormError] = useState('')

  const handleResolve = (id: string) => {
    if (!resolutionText.trim()) return

    startTransition(async () => {
      const res = await resolveIncidentAction(id, resolutionText)
      if (res.success) {
        setResolvingId(null)
        setResolutionText('')
        // Update local state optimistically
        setIncidents((prev) => prev.filter((inc) => inc.id !== id))
        router.refresh()
      } else {
        alert('Error al resolver la incidencia: ' + res.error)
      }
    })
  }

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!newBookingId || !newType || !newDescription) {
      setFormError('Por favor complete todos los campos obligatorios.')
      return
    }

    startTransition(async () => {
      const res = await createIncidentAction({
        bookingId: newBookingId,
        type: newType,
        description: newDescription,
        priority: newPriority,
      })

      if (res.success) {
        setShowReportForm(false)
        setNewType('')
        setNewDescription('')
        router.refresh()
        // Simple reload to fetch newly created incident
        window.location.reload()
      } else {
        setFormError(res.error || 'Error al reportar incidencia.')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Create Incident Button */}
      {!showReportForm ? (
        <button
          onClick={() => setShowReportForm(true)}
          className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Reportar Incidencia en Destino</span>
        </button>
      ) : (
        /* Report Form Card */
        <form onSubmit={handleCreateIncident} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3.5 text-xs">
          <h4 className="font-bold text-slate-200">Log Nueva Incidencia en Destino</h4>
          
          {formError && <p className="text-[10px] text-red-400">{formError}</p>}

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Reserva Asociada</label>
            <select
              value={newBookingId}
              onChange={(e) => setNewBookingId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-2 text-xs text-white focus:outline-none"
            >
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.confirmationCode || 'Reserva'} - {b.client.firstName} {b.client.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tipo de Incidencia *</label>
            <input
              type="text"
              required
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Ej. Pérdida de equipaje, Cancelación de vuelo, Hotel sobrevendido"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none placeholder-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Detalle de Incidencia *</label>
              <textarea
                required
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describa el inconveniente que tiene el viajero en destino..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none placeholder-slate-700 resize-none"
              />
            </div>
            
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Nivel de Prioridad</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as IncidentPriority)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-2 text-xs text-white focus:outline-none"
              >
                <option value="LOW">Baja (LOW)</option>
                <option value="MEDIUM">Media (MEDIUM)</option>
                <option value="HIGH">Alta (HIGH)</option>
                <option value="CRITICAL">Crítica (CRITICAL)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-850">
            <button
              type="button"
              onClick={() => setShowReportForm(false)}
              className="bg-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-red-600 hover:bg-red-500 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold transition flex items-center gap-1"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              <span>Reportar</span>
            </button>
          </div>
        </form>
      )}

      {/* Incidents List */}
      <div className="space-y-3">
        {incidents.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8 italic border border-dashed border-slate-800/80 rounded-2xl">
            No hay incidencias activas en destino.
          </div>
        ) : (
          incidents.map((inc) => {
            const config = PRIORITY_CONFIG[inc.priority]
            const isResolving = resolvingId === inc.id
            return (
              <div
                key={inc.id}
                className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3 relative transition hover:border-slate-800"
              >
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h5 className="font-bold text-slate-200 text-xs">{inc.type}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Viajero: {inc.booking.client.firstName} {inc.booking.client.lastName}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
                    {config.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-850/50">
                  {inc.description}
                </p>

                {/* Resolve Action */}
                {!isResolving ? (
                  <button
                    onClick={() => setResolvingId(inc.id)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-slate-100 border border-slate-700 py-1.5 px-3 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Marcar Resuelta</span>
                  </button>
                ) : (
                  /* Inline Resolution Form */
                  <div className="space-y-2 pt-2 border-t border-slate-850/80">
                    <input
                      type="text"
                      placeholder="Ej. Se localizó maleta e Iberia la envió en taxi al hotel."
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none placeholder-slate-700"
                    />
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => setResolvingId(null)}
                        className="bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] py-1 px-2.5 rounded-lg border border-slate-700/50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleResolve(inc.id)}
                        disabled={isPending || !resolutionText.trim()}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] py-1 px-2.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        <span>Resolver</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
