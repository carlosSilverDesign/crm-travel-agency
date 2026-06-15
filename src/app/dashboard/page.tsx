export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { getClients } from '@/modules/clients/queries'
import { getOpportunities } from '@/modules/opportunities/queries'
import { getActiveIncidents } from '@/modules/bookings/queries'
import {
  Users,
  Target,
  AlertOctagon,
  Sparkles,
  Plane,
  Plus,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  FileText,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  // Fetch active counts and statistics
  const clientsRes = await getClients({ pageSize: 5 })
  const oppsRes = await getOpportunities()
  const incidentsRes = await getActiveIncidents()

  const clients = clientsRes.success && clientsRes.data ? clientsRes.data.clients : []
  const opportunities = oppsRes.success && oppsRes.data ? oppsRes.data : []
  const incidents = incidentsRes.success && incidentsRes.data ? incidentsRes.data : []

  // Metrics calculations
  const totalClients = await prisma.client.count()
  const activeOpps = opportunities.filter((o) => o.stage !== 'LOST' && o.stage !== 'WON' && o.stage !== 'POST_SALE').length
  const pipelineValue = opportunities
    .filter((o) => o.stage !== 'LOST' && o.stage !== 'WON')
    .reduce((sum, o) => sum + o.estimatedValue, 0)
  
  // Recent interactions across all clients
  const recentInteractions = await prisma.interaction.findMany({
    take: 5,
    orderBy: { occurredAt: 'desc' },
    include: {
      client: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Greeting Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/90 via-indigo-600/80 to-purple-600/60 rounded-3xl p-6 md:p-8 border border-blue-500/20 shadow-xl shadow-indigo-500/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[80px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-indigo-100 backdrop-blur-sm border border-white/10 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Panel Operativo Activo</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
            ¡Hola, Asesor Demo!
          </h1>
          <p className="text-indigo-100 text-xs md:text-sm leading-relaxed">
            Bienvenido a tu panel de control de Continents Travel. Tienes un pipeline activo valorado en{' '}
            <strong className="text-white font-extrabold">${pipelineValue.toLocaleString()}</strong> y{' '}
            {incidents.length} incidencias en destino requiriendo tu atención.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/dashboard/opportunities?create=true"
              className="bg-white text-indigo-900 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer btn-registrar-trato"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar Trato</span>
            </Link>
            <Link
              href="/dashboard/quotes?new=true"
              className="bg-indigo-950/40 hover:bg-indigo-950/60 border border-white/15 text-white rounded-xl px-4 py-2.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Crear Propuesta</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pasajeros Totales</p>
            <p className="text-lg font-black text-slate-100 mt-0.5">{totalClients}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tratos Activos</p>
            <p className="text-lg font-black text-slate-100 mt-0.5">{activeOpps}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor de Pipeline</p>
            <p className="text-lg font-black text-slate-100 mt-0.5">${pipelineValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alertas Destino</p>
            <p className="text-lg font-black text-slate-100 mt-0.5">{incidents.length}</p>
          </div>
        </div>
      </div>

      {/* 3. Recent Activity & Quick Nav split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent timeline events (Left 7 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
            <MessageSquare className="h-4.5 w-4.5 text-blue-400" />
            <span>Última Actividad y Timeline de Contactos</span>
          </h3>

          <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-4 text-xs">
            {recentInteractions.length === 0 ? (
              <p className="text-slate-500 italic py-2">Sin actividad registrada recientemente.</p>
            ) : (
              recentInteractions.map((act) => (
                <div key={act.id} className="relative">
                  <div className="absolute -left-[22.5px] top-0.5 h-4 w-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[7px] text-slate-400 font-bold">
                    {act.channel.substring(0, 2)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-200">{act.subject}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(act.occurredAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-400">
                      Cliente: <strong className="text-slate-300">{act.client.firstName} {act.client.lastName}</strong> • {act.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links / Highlights (Right 5 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
              <span>Enlaces Rápidos</span>
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/dashboard/opportunities"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 hover:bg-slate-950 border border-transparent hover:border-slate-700/50 transition text-xs"
              >
                <div>
                  <p className="font-bold text-slate-200">Ver Pipeline Kanban</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Gestión visual de prospectos y reservas</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </Link>

              <Link
                href="/dashboard/clients"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 hover:bg-slate-950 border border-transparent hover:border-slate-700/50 transition text-xs"
              >
                <div>
                  <p className="font-bold text-slate-200">Fichas Únicas de Pasajero</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Control de pasaportes, preferencias y visas</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </Link>
            </div>
          </div>

          <div className="bg-indigo-950/10 border border-indigo-900/20 rounded-2xl p-4 text-center mt-4 space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Soporte Operativo</p>
            <p className="text-xs text-slate-200 leading-relaxed">
              ¿Tienes algún problema con un proveedor o transporte? Reporta directo desde la sección operativa.
            </p>
            <Link
              href="/dashboard/bookings"
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold inline-block pt-1.5"
            >
              Ir a Operaciones →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
