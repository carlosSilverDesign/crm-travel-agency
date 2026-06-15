'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { updateOpportunityStageAction } from '@/app/actions/opportunities.actions'
import { OpportunityStage, TravelerType } from '@prisma/client'
import {
  DollarSign,
  Compass,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  User,
  Sparkles,
  Award,
} from 'lucide-react'

// Translation and styling helper for stages
const STAGE_CONFIG: Record<
  OpportunityStage,
  { label: string; color: string; bg: string; border: string }
> = {
  PROSPECT: {
    label: 'Prospecto',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  QUOTED: {
    label: 'Cotizado',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  NEGOTIATION: {
    label: 'Negociación',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  BOOKED: {
    label: 'Reservado',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  TRAVELING: {
    label: 'Viajando',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
  },
  POST_SALE: {
    label: 'Posventa',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  WON: {
    label: 'Ganado',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  LOST: {
    label: 'Perdido',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
}

interface OpportunityCard {
  id: string
  title: string
  stage: OpportunityStage
  estimatedValue: number
  currency: string
  probability: number
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    travelerType: TravelerType
    totalSpent: number
  }
}

interface KanbanBoardProps {
  initialOpportunities: OpportunityCard[]
}

export default function KanbanBoard({ initialOpportunities }: KanbanBoardProps) {
  const [opportunities, setOpportunities] = useState<OpportunityCard[]>(initialOpportunities)
  const [activeTab, setActiveTab] = useState<OpportunityStage>('PROSPECT')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Move opportunity state helper
  const moveOpportunity = async (oppId: string, newStage: OpportunityStage) => {
    // 1. Guardar estado anterior para rollback
    const previousOpps = [...opportunities]

    // 2. Actualizar estado optimista
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stage: newStage } : o))
    )

    // 3. Ejecutar acción en el servidor
    startTransition(async () => {
      const res = await updateOpportunityStageAction(oppId, newStage)
      if (!res.success) {
        // Rollback
        setOpportunities(previousOpps)
        alert('Error al mover la oportunidad: ' + res.error)
      }
    })
  }

  // Native HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setDraggedId(id)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Required to allow drop
  }

  const handleDrop = (e: React.DragEvent, stage: OpportunityStage) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      moveOpportunity(id, stage)
    }
  }

  // Get opportunities in a specific stage
  const getOppsByStage = (stage: OpportunityStage) => {
    return opportunities.filter((o) => o.stage === stage)
  }

  // Calculate column sums
  const getStageSum = (stage: OpportunityStage) => {
    return getOppsByStage(stage).reduce((sum, o) => sum + o.estimatedValue, 0)
  }

  return (
    <div className="space-y-6">
      {/* MOBILE BOARD LAYOUT (swiped or tabbed columns, visible < 1024px) */}
      <div className="block lg:hidden space-y-4">
        {/* Tab Selection Scrollbar */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
          {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
            const count = getOppsByStage(stage as OpportunityStage).length
            const isActive = activeTab === stage
            return (
              <button
                key={stage}
                onClick={() => setActiveTab(stage as OpportunityStage)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{config.label}</span>
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Column Title and Value Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-200">
            Fase: {STAGE_CONFIG[activeTab].label}
          </span>
          <span className="text-slate-400">
            Total Proyectado:{' '}
            <strong className="text-slate-100 font-extrabold ml-1">
              ${getStageSum(activeTab).toLocaleString()}
            </strong>
          </span>
        </div>

        {/* Opportunity Card List for active tab */}
        <div className="space-y-3">
          {getOppsByStage(activeTab).length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500 italic">
              No hay tratos en esta fase.
            </div>
          ) : (
            getOppsByStage(activeTab).map((opp) => (
              <div
                key={opp.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-md relative"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-slate-100">{opp.title}</h4>
                    <span className="font-bold text-slate-100 text-sm">
                      ${opp.estimatedValue.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <User className="h-3 w-3 text-slate-500" />
                    <span>
                      {opp.client.firstName} {opp.client.lastName}
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.2 rounded uppercase tracking-wider">
                      {opp.client.travelerType}
                    </span>
                  </p>
                </div>

                {/* Move Stage controls inside Mobile card */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Probabilidad: {opp.probability}%
                  </span>
                  
                  {/* Select menu to move opportunity */}
                  <select
                    value={opp.stage}
                    onChange={(e) => moveOpportunity(opp.id, e.target.value as OpportunityStage)}
                    className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-2.5 text-[10px] font-semibold text-slate-300 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    {Object.entries(STAGE_CONFIG).map(([s, config]) => (
                      <option key={s} value={s}>
                        Mover a: {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DESKTOP BOARD LAYOUT (8 Columns scrollable horizontally, visible >= 1024px) */}
      <div className="hidden lg:flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scroll-smooth select-none max-h-[70vh]">
        {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
          const count = getOppsByStage(stage as OpportunityStage).length
          const isOver = draggedId !== null // Can style columns when dragging is active
          return (
            <div
              key={stage}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage as OpportunityStage)}
              className={`w-72 shrink-0 rounded-2xl bg-slate-900/40 border p-4 flex flex-col max-h-full transition-all duration-200 ${
                isOver ? 'border-slate-800 bg-slate-900/60' : 'border-slate-800/50'
              }`}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-3.5 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                  <h4 className="font-bold text-xs text-slate-200">{config.label}</h4>
                </div>
                <span className="bg-slate-800/60 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {count}
                </span>
              </div>

              {/* Column value sum */}
              <p className="text-[10px] text-slate-400 mb-4 flex justify-between items-center">
                <span>Total Proyectado:</span>
                <span className="font-extrabold text-slate-200">
                  ${getStageSum(stage as OpportunityStage).toLocaleString()}
                </span>
              </p>

              {/* Cards Wrapper */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar min-h-[300px]">
                {getOppsByStage(stage as OpportunityStage).map((opp) => (
                  <div
                    key={opp.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opp.id)}
                    onDragEnd={handleDragEnd}
                    className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl shadow-md space-y-3 cursor-grab active:cursor-grabbing hover:bg-slate-800/30 transition duration-150 relative group"
                  >
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-slate-200 group-hover:text-slate-100 truncate">
                        {opp.title}
                      </h5>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {opp.client.firstName} {opp.client.lastName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className="bg-slate-850 border border-slate-800 text-slate-400 px-2 py-0.2 rounded-md font-medium uppercase tracking-wider text-[8px]">
                        {opp.client.travelerType}
                      </span>
                      <span className="font-bold text-slate-100">
                        ${opp.estimatedValue.toLocaleString()}
                      </span>
                    </div>

                    {/* Quick navigation arrows (visible on hover) */}
                    <div className="absolute right-3.5 top-3.5 opacity-0 group-hover:opacity-100 flex gap-1 transition duration-150">
                      {stage !== 'PROSPECT' && (
                        <button
                          onClick={() => {
                            const stages = Object.keys(STAGE_CONFIG) as OpportunityStage[]
                            const index = stages.indexOf(opp.stage)
                            moveOpportunity(opp.id, stages[index - 1])
                          }}
                          className="p-1 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md text-slate-400 hover:text-slate-100"
                          title="Fase anterior"
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                      )}
                      {stage !== 'WON' && stage !== 'LOST' && (
                        <button
                          onClick={() => {
                            const stages = Object.keys(STAGE_CONFIG) as OpportunityStage[]
                            const index = stages.indexOf(opp.stage)
                            moveOpportunity(opp.id, stages[index + 1])
                          }}
                          className="p-1 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md text-slate-400 hover:text-slate-100"
                          title="Siguiente fase"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {getOppsByStage(stage as OpportunityStage).length === 0 && (
                  <div className="text-center text-slate-600 italic text-[10px] py-12 border border-dashed border-slate-800/60 rounded-xl">
                    Arrastra aquí
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
