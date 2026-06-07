export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { getQuotes } from '@/modules/quotes/queries'
import { getOpportunities } from '@/modules/opportunities/queries'
import { convertCurrency } from '@/modules/quotes/currency'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  FileDown,
  Sparkles,
  DollarSign,
  Calendar,
  Layers,
  TrendingUp,
} from 'lucide-react'
import QuoteBuilderForm from './QuoteBuilderForm'

// Seed mock providers and quotes if empty
async function ensureSeedQuotes() {
  const providersCount = await prisma.provider.count()
  if (providersCount === 0) {
    await prisma.provider.createMany({
      data: [
        {
          name: 'Iberia Airlines',
          type: 'AIRLINE',
          contactEmail: 'groups@iberia.com',
          paymentTermsDays: 15,
          commissionRate: 5.0,
        },
        {
          name: 'Marriott Bonvoy',
          type: 'HOTEL',
          contactEmail: 'booking@marriott.com',
          paymentTermsDays: 30,
          commissionRate: 10.0,
        },
        {
          name: 'Expedia Partner Solutions',
          type: 'WHOLESALER',
          contactEmail: 'partners@expedia.com',
          paymentTermsDays: 45,
          commissionRate: 12.0,
        },
      ],
    })
  }

  const quotesCount = await prisma.quote.count()
  if (quotesCount === 0) {
    const opps = await prisma.opportunity.findMany()
    const user = await prisma.user.findFirst()
    const provider = await prisma.provider.findFirst()

    if (opps.length > 0 && user && provider) {
      const juanOpp = opps.find((o) => o.title.includes('París'))
      if (juanOpp) {
        // Create a mock quote for Juan
        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + 15)

        const quote = await prisma.quote.create({
          data: {
            opportunityId: juanOpp.id,
            clientId: juanOpp.clientId,
            agentId: user.id,
            status: 'SENT',
            validUntil,
            totalAmount: 5400.0,
            currency: 'USD',
            itinerary: JSON.stringify([
              { day: 1, title: 'Llegada a París', description: 'Traslado del aeropuerto al hotel Marriott. Check-in y descanso.', activities: ['Traslado Privado'] },
              { day: 2, title: 'Tour Eiffel y Crucero Sena', description: 'Visita guiada a la Torre Eiffel y paseo en barco por la tarde.', activities: ['Tour Eiffel', 'Paseo en barco'] },
            ]),
          },
        })

        await prisma.quoteItem.createMany({
          data: [
            {
              quoteId: quote.id,
              type: 'FLIGHT',
              description: 'Vuelo Madrid - París (Iberia, Clase Turista)',
              quantity: 1,
              unitPrice: 400.0,
              currency: 'EUR',
              providerId: provider.id,
            },
            {
              quoteId: quote.id,
              type: 'HOTEL',
              description: 'Hotel Marriott Rive Gauche (4 noches, Desayuno incl.)',
              quantity: 1,
              unitPrice: 1200.0,
              currency: 'USD',
              providerId: provider.id,
            },
            {
              quoteId: quote.id,
              type: 'ACTIVITY',
              description: 'París Explorer Pass (Atracciones premium)',
              quantity: 1,
              unitPrice: 150.0,
              currency: 'USD',
            },
          ],
        })
      }
    }
  }
}

interface PageProps {
  searchParams: Promise<{
    new?: string
    oppId?: string
  }>
}

export default async function QuotesPage({ searchParams }: PageProps) {
  await ensureSeedQuotes()
  
  const params = await searchParams
  const isNew = params.new === 'true'
  const oppId = params.oppId || ''

  // Fetch data
  const quotesRes = await getQuotes()
  const oppsRes = await getOpportunities()
  const providers = await prisma.provider.findMany({ where: { isActive: true } })

  const quotes = quotesRes.success && quotesRes.data ? quotesRes.data : []
  const opportunities = oppsRes.success && oppsRes.data ? oppsRes.data : []

  // Metrics
  const activeQuotesCount = quotes.filter((q) => q.status === 'SENT' || q.status === 'VIEWED').length
  const acceptedValue = quotes
    .filter((q) => q.status === 'ACCEPTED')
    .reduce((sum, q) => sum + q.totalAmount, 0)
  const conversionRate = quotes.length > 0
    ? (quotes.filter((q) => q.status === 'ACCEPTED').length / quotes.length) * 100
    : 0

  if (isNew) {
    // Renders the interactive Quote Builder
    const targetOpp = opportunities.find((o) => o.id === oppId)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/quotes"
            className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold transition"
          >
            ← Volver al Listado
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white">Diseñar Nueva Cotización</h2>
        </div>

        <QuoteBuilderForm
          opportunities={opportunities as any}
          providers={providers as any}
          preselectedOppId={oppId}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <p className="text-sm text-slate-400">
            Crea propuestas de viaje interactivas en múltiples divisas con conversión automática
          </p>
        </div>

        <Link
          href="?new=true"
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Nueva Cotización</span>
        </Link>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Propuestas Activas</p>
            <p className="text-xl font-bold text-white mt-0.5">{activeQuotesCount}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Monto Aceptado</p>
            <p className="text-xl font-bold text-white mt-0.5">${acceptedValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Tasa de Aceptación</p>
            <p className="text-xl font-bold text-white mt-0.5">{conversionRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Quotes Table/List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40">
          <h3 className="font-bold text-base text-white">Cotizaciones Generadas</h3>
        </div>

        {quotes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Aún no has creado ninguna cotización. Haz clic en "Nueva Cotización" para comenzar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/20">
                  <th className="p-4 pl-6">Cliente / Oportunidad</th>
                  <th className="p-4">Vence el</th>
                  <th className="p-4">Moneda</th>
                  <th className="p-4">Monto Total</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 pr-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-200">
                        {quote.client.firstName} {quote.client.lastName}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Propuesta: {quote.opportunity.title}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      {new Date(quote.validUntil).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-400 font-semibold">{quote.currency}</td>
                    <td className="p-4 text-slate-200 font-bold">
                      ${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px] border ${
                          quote.status === 'ACCEPTED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : quote.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : quote.status === 'SENT'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : quote.status === 'VIEWED'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
                        }`}
                      >
                        {quote.status === 'ACCEPTED' ? 'Aceptada' : quote.status === 'REJECTED' ? 'Rechazada' : quote.status === 'SENT' ? 'Enviada' : quote.status === 'VIEWED' ? 'Leída' : 'Borrador'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex gap-2 justify-end">
                        {/* Download PDF simulation */}
                        <a
                          href={quote.pdfUrl || '#'}
                          className={`p-1.5 rounded-lg border text-slate-400 hover:text-white transition ${quote.pdfUrl ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700' : 'border-slate-800/30 opacity-40 cursor-not-allowed'}`}
                          title="Descargar PDF"
                          target={quote.pdfUrl ? '_blank' : undefined}
                          rel={quote.pdfUrl ? 'noopener noreferrer' : undefined}
                        >
                          <FileDown className="h-4 w-4" />
                        </a>

                        {/* Accept button action */}
                        {quote.status !== 'ACCEPTED' && quote.status !== 'REJECTED' && (
                          <div className="flex gap-1">
                            <Link
                              href={`/api/public/quotes/accept?id=${quote.id}`}
                              className="p-1.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-lg transition"
                              title="Marcar Aceptada"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/api/public/quotes/reject?id=${quote.id}`}
                              className="p-1.5 border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg transition"
                              title="Marcar Rechazada"
                            >
                              <XCircle className="h-4 w-4" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
