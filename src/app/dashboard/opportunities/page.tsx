export const dynamic = 'force-dynamic'

import { getOpportunities } from '@/modules/opportunities/queries'
import { getClients } from '@/modules/clients/queries'
import prisma from '@/lib/prisma'
import KanbanBoard from './KanbanBoard'
import Link from 'next/link'
import { Plus, Target, Kanban, DollarSign } from 'lucide-react'
import OpportunityFormDialog from './OpportunityFormDialog'

async function ensureSeedOpportunities() {
  const count = await prisma.opportunity.count()
  if (count === 0) {
    const clients = await prisma.client.findMany()
    const user = await prisma.user.findFirst()

    if (clients.length > 0 && user) {
      // Create a few opportunities for the seeded clients
      const juan = clients.find((c) => c.firstName === 'Juan')
      const maria = clients.find((c) => c.firstName === 'María')
      const carlos = clients.find((c) => c.firstName === 'Carlos')
      const ana = clients.find((c) => c.firstName === 'Ana')

      if (juan) {
        await prisma.opportunity.create({
          data: {
            title: 'Paquete París de Lujo',
            clientId: juan.id,
            agentId: user.id,
            stage: 'QUOTED',
            estimatedValue: 5400.0,
            probability: 30,
            source: 'REFERRAL',
            notes: 'Quiere tour privado al Louvre y Versalles.',
          },
        })
      }

      if (maria) {
        await prisma.opportunity.create({
          data: {
            title: 'Luna de Miel en Maldivas',
            clientId: maria.id,
            agentId: user.id,
            stage: 'PROSPECT',
            estimatedValue: 12000.0,
            probability: 10,
            source: 'SOCIAL',
            notes: 'Busca resort todo incluido de 5 estrellas con overwater villa.',
          },
        })
      }

      if (carlos) {
        await prisma.opportunity.create({
          data: {
            title: 'Pasajes Corporativos Madrid',
            clientId: carlos.id,
            agentId: user.id,
            stage: 'NEGOTIATION',
            estimatedValue: 2500.0,
            probability: 50,
            source: 'WEB',
            notes: 'Viaje urgente de negocios para el CEO y director.',
          },
        })
      }

      if (ana) {
        await prisma.opportunity.create({
          data: {
            title: 'Viaje Familiar Disney World',
            clientId: ana.id,
            agentId: user.id,
            stage: 'BOOKED',
            estimatedValue: 8300.0,
            probability: 100,
            source: 'WALK_IN',
            notes: 'Hotel temático dentro del parque, pases de 5 días con Hopper.',
          },
        })
      }
    }
  }
}

interface PageProps {
  searchParams: Promise<{
    create?: string
  }>
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  await ensureSeedOpportunities()
  const params = await searchParams
  const showCreate = params.create === 'true'

  // Fetch opportunities & clients for creation dropdown
  const oppRes = await getOpportunities()
  const clientsRes = await getClients({ pageSize: 100 })

  const opportunities = oppRes.success && oppRes.data ? oppRes.data : []
  const clients = clientsRes.success && clientsRes.data ? clientsRes.data.clients : []

  // Get active agent for seeding
  const user = await prisma.user.findFirst()
  const agentId = user?.id || ''

  // Calculate quick metrics
  const totalValue = opportunities.reduce(
    (sum, o) => (o.stage !== 'LOST' && o.stage !== 'WON' ? sum + o.estimatedValue : sum),
    0
  )
  const activeOpportunities = opportunities.filter(
    (o) => o.stage !== 'LOST' && o.stage !== 'WON' && o.stage !== 'POST_SALE'
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <p className="text-sm text-slate-400">
            Administra tus tratos en curso y proyecta tus cierres de venta
          </p>
        </div>

        <Link
          href="?create=true"
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Nueva Oportunidad</span>
        </Link>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Tratos Activos</p>
            <p className="text-xl font-bold text-white mt-0.5">{activeOpportunities}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Valor de Pipeline</p>
            <p className="text-xl font-bold text-white mt-0.5">${totalValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Kanban className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Etapas</p>
            <p className="text-xl font-bold text-white mt-0.5">8 Fases del Flujo</p>
          </div>
        </div>
      </div>

      {/* Interactive Kanban Board */}
      <KanbanBoard initialOpportunities={opportunities as any} />

      {/* Creation Modal */}
      {showCreate && (
        <OpportunityFormDialog clients={clients as any} agentId={agentId} />
      )}
    </div>
  )
}
