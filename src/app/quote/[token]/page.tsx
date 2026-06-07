import { getQuoteById } from '@/modules/quotes/queries'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plane, Calendar, MapPin, Compass, Briefcase, FileDown, Check, X, Sparkles } from 'lucide-react'
import ViewTracker from './ViewTracker'

interface PageProps {
  params: Promise<{
    token: string
  }>
}

export default async function PublicQuotePage({ params }: PageProps) {
  const resolvedParams = await params
  const { token } = resolvedParams

  // Fetch quote details
  const res = await getQuoteById(token)
  
  if (!res.success || !res.data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="inline-flex h-12 w-12 rounded-xl bg-red-500/10 items-center justify-center text-red-400 border border-red-500/20">
            <X className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">Propuesta No Encontrada</h1>
          <p className="text-slate-400 max-w-sm">El enlace es inválido o la cotización ya ha expirado.</p>
        </div>
      </div>
    )
  }

  const quote = res.data
  const itinerary = quote.itinerary ? JSON.parse(JSON.stringify(quote.itinerary)) : []

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_at_top,#1e1b4b,transparent_60%)] opacity-30 pointer-events-none" />

      {/* Tracker Client Component */}
      <ViewTracker quoteId={quote.id} />

      {/* Top Bar for client */}
      <header className="h-16 bg-slate-900/40 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-6 max-w-6xl mx-auto rounded-b-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-blue-500 rotate-45" />
          <span className="font-bold text-sm text-slate-200">Antigravity Travel</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Asesor: {quote.agent.name}</span>
          {quote.pdfUrl && (
            <a
              href={quote.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-1.5 rounded-xl border border-slate-700 font-semibold flex items-center gap-1.5 transition"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>PDF</span>
            </a>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8 relative">
        {/* Proposal Header Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bg-blue-500/10 text-blue-400 text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest border-l border-b border-blue-500/20">
            Propuesta de Viaje
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {quote.opportunity.title}
            </h1>
            <p className="text-slate-400 text-sm">
              Diseñado exclusivamente para: <strong className="text-slate-200">{quote.client.firstName} {quote.client.lastName}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 text-xs">
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Fecha Propuesta</p>
              <p className="text-slate-200 font-bold mt-0.5">{formatDate(quote.createdAt)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Válido hasta</p>
              <p className="text-slate-200 font-bold mt-0.5">{formatDate(quote.validUntil)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Moneda base</p>
              <p className="text-slate-200 font-bold mt-0.5">{quote.currency}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Precio Total</p>
              <p className="text-emerald-400 font-black text-sm mt-0.5">${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Trip Segments (Flights, Hotels) */}
        <div className="space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2 px-1">
            <Briefcase className="h-5 w-5 text-blue-400" />
            <span>Servicios Incluidos en tu Paquete</span>
          </h3>

          <div className="space-y-3">
            {quote.items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-slate-800/60 hover:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-slate-850 border border-slate-800 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {item.type}
                    </span>
                    {item.provider && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        Vía {item.provider.name}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-slate-200 text-sm leading-relaxed">{item.description}</p>
                  <p className="text-[10px] text-slate-500">
                    Cantidad: {item.quantity} • Precio Unitario: {item.currency} {item.unitPrice.toLocaleString()}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] text-slate-500 block">Subtotal</span>
                  <span className="font-bold text-slate-200 text-sm mt-0.5">
                    {item.currency} ${(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Itinerary Timeline */}
        {itinerary.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2 px-1">
              <Compass className="h-5 w-5 text-indigo-400" />
              <span>Itinerario Día por Día</span>
            </h3>

            <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
              {itinerary.map((day: any) => (
                <div key={day.day} className="relative group">
                  {/* Day marker node */}
                  <div className="absolute -left-[35px] top-0.5 h-6 w-6 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center text-[10px] font-bold text-indigo-400 shadow-md">
                    {day.day}
                  </div>

                  <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl space-y-2 group-hover:border-slate-800 transition">
                    <h4 className="font-bold text-sm text-slate-100">{day.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{day.description}</p>
                    {day.activities?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {day.activities.map((act: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-indigo-950/20 border border-indigo-900/30 text-indigo-400 text-[9px] px-2 py-0.5 rounded"
                          >
                            {act}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Actions for Client */}
        {quote.status !== 'ACCEPTED' && quote.status !== 'REJECTED' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-white">¿Deseas confirmar este viaje?</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Si estás de acuerdo con los servicios, tarifas e itinerario propuestos, puedes confirmar tu aceptación. Nos pondremos en contacto contigo de inmediato para gestionar los pagos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href={`/api/public/quotes/reject?id=${quote.id}`}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl px-6 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="h-4.5 w-4.5 text-rose-500" />
                <span>Rechazar Propuesta</span>
              </a>
              <a
                href={`/api/public/quotes/accept?id=${quote.id}`}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl px-6 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/10"
              >
                <Check className="h-4.5 w-4.5 text-white" />
                <span>Aceptar y Reservar</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-center space-y-2 shadow-xl">
            <h3 className="font-bold text-base text-white">Estado de la propuesta</h3>
            <p className="text-xs text-slate-400">
              Esta cotización ha sido marcada como{' '}
              <strong className={quote.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-rose-400'}>
                {quote.status === 'ACCEPTED' ? 'ACEPTADA' : 'RECHAZADA'}
              </strong>
              .
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
