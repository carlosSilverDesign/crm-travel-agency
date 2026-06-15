'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TravelerType } from '@prisma/client'
import {
  Users,
  Search,
  Plus,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  DollarSign,
  Award,
  Compass,
  ArrowLeft,
  Tag,
  Clock,
  FileText,
  Plane,
  Loader2,
  Edit,
} from 'lucide-react'
import Link from 'next/link'
import ClientFormDialog from './ClientFormDialog'
import { getClientDetailAction } from '@/app/actions/clients.actions'

interface ClientProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  birthDate: Date | null
  nationality: string | null
  passportNumber: string | null
  passportExpiry: Date | null
  travelerType: TravelerType
  loyaltyPoints: number
  totalSpent: number
  assignedAgentId: string | null
  tags: string[]
  notes: string | null
  preferences: string | null
  documentFiles: string | null
  travelHistory?: any[]
  interactions?: any[]
}

interface ClientsDashboardClientProps {
  initialClients: ClientProfile[]
  alerts: any[]
  initialSelectedClientId: string
  initialSelectedClient: ClientProfile | null
  initialQuery: string
  initialTypeFilter?: TravelerType
  initialShowCreate?: boolean
}

export default function ClientsDashboardClient({
  initialClients,
  alerts,
  initialSelectedClientId,
  initialSelectedClient,
  initialQuery,
  initialTypeFilter,
  initialShowCreate,
}: ClientsDashboardClientProps) {
  const router = useRouter()
  const [clients, setClients] = useState<ClientProfile[]>(initialClients)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [typeFilter, setTypeFilter] = useState<TravelerType | undefined>(initialTypeFilter)
  const [selectedClientId, setSelectedClientId] = useState(initialSelectedClientId)
  const [selectedClientDetail, setSelectedClientDetail] = useState<any>(initialSelectedClient)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showCreate, setShowCreate] = useState(initialShowCreate || false)
  const [showEdit, setShowEdit] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Sync clients state if initialClients changes (e.g. after router.refresh())
  useEffect(() => {
    setClients(initialClients)
  }, [initialClients])

  // Fetch client details when selectedClientId changes
  useEffect(() => {
    if (!selectedClientId) {
      setSelectedClientDetail(null)
      return
    }

    // If initial selected client matches, skip first fetch
    if (initialSelectedClient && initialSelectedClient.id === selectedClientId && !selectedClientDetail) {
      setSelectedClientDetail(initialSelectedClient)
      return
    }

    // Don't refetch if we already have it and it matches
    if (selectedClientDetail && selectedClientDetail.id === selectedClientId) {
      return
    }

    let isMounted = true
    setLoadingDetail(true)

    getClientDetailAction(selectedClientId)
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data) {
            setSelectedClientDetail(res.data)
          } else {
            console.error(res.error)
          }
          setLoadingDetail(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err)
          setLoadingDetail(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedClientId, initialSelectedClient])

  // Sync URL search parameters
  const updateUrlParams = (newParams: { q?: string; type?: string; clientId?: string }) => {
    const url = new URL(window.location.href)
    
    if (newParams.q !== undefined) {
      if (newParams.q) url.searchParams.set('q', newParams.q)
      else url.searchParams.delete('q')
    }
    
    if (newParams.type !== undefined) {
      if (newParams.type) url.searchParams.set('type', newParams.type)
      else url.searchParams.delete('type')
    }
    
    if (newParams.clientId !== undefined) {
      if (newParams.clientId) url.searchParams.set('clientId', newParams.clientId)
      else url.searchParams.delete('clientId')
    }

    window.history.replaceState(null, '', url.pathname + url.search)
  }

  // Handle client selection
  const handleSelectClient = (id: string) => {
    setSelectedClientId(id)
    updateUrlParams({ clientId: id })
  }

  // Handle traveler type filter change
  const handleTypeFilterChange = (type: TravelerType | undefined) => {
    setTypeFilter(type)
    setSelectedClientId('')
    setSelectedClientDetail(null)
    updateUrlParams({ 
      type: type || '', 
      clientId: '' 
    })
  }

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    // Deselect if we filter, or keep it. Let's keep URL param updated.
    updateUrlParams({ q: value })
  }

  // Filter clients based on client-side state
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      !searchQuery ||
      client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.phone && client.phone.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = !typeFilter || client.travelerType === typeFilter

    return matchesSearch && matchesType
  })

  // Calculate stats based on full list (global stats)
  const totalClients = clients.length
  const totalLTV = clients.reduce((sum, c) => sum + c.totalSpent, 0)
  const expiringPassportsCount = alerts.length
  const vipCount = clients.filter(c => c.tags.includes('vip') || c.totalSpent > 5000).length

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between animate-fade-in text-emerald-400 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)} 
            className="text-xs text-emerald-500 hover:text-emerald-400 font-bold px-2 py-1 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      )}
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar cliente por nombre, email, teléfono..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Nuevo Pasajero</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Pasajeros</p>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{totalClients}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">LTV Total</p>
            <p className="text-xl font-bold text-slate-100 mt-0.5">${totalLTV.toLocaleString('es-ES')}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">VIP / Alta Gama</p>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{vipCount}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Venc. Pasaporte</p>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{expiringPassportsCount}</p>
          </div>
        </div>
      </div>

      {/* Expiry Alerts Notification Box */}
      {alerts.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Atención: Pasaportes por vencer (&lt;90 días)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((c: any) => {
              const daysLeft = Math.ceil(
                (new Date(c.passportExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )
              const isExpired = daysLeft < 0
              return (
                <div
                  key={c.id}
                  className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-200">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-slate-400 mt-0.5">
                      Pasaporte: {c.passportNumber || 'N/D'} • Expiración:{' '}
                      <span className={isExpired ? 'text-red-400 font-semibold' : 'text-amber-400 font-semibold'}>
                        {new Date(c.passportExpiry).toLocaleDateString('es-ES')}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                      isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isExpired ? 'Vencido' : `En ${daysLeft} días`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Passenger List Column (Left in Desktop) */}
        <div className="lg:col-span-7 space-y-4 w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {/* Header / Filter Tabs */}
            <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
              <h3 className="font-bold text-base text-slate-100">Listado de Pasajeros</h3>
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => handleTypeFilterChange(undefined)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    !typeFilter
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos
                </button>
                {Object.values(TravelerType).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeFilterChange(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      typeFilter === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {filteredClients.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No se encontraron pasajeros con los filtros aplicados.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client.id)}
                    className={`flex items-center justify-between p-5 hover:bg-slate-800/40 transition duration-200 cursor-pointer ${
                      selectedClientId === client.id ? 'bg-blue-600/10 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="space-y-1.5 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-100 text-sm">
                          {client.firstName} {client.lastName}
                        </span>
                        <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {client.travelerType}
                        </span>
                        {client.totalSpent >= 5000 && (
                          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                            <Award className="h-2.5 w-2.5" />
                            <span>Lujo</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-500" />
                          {client.email}
                        </span>
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-slate-500" />
                            {client.phone}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 flex-wrap pt-0.5">
                        {client.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="bg-blue-950/20 border border-blue-900/30 text-blue-400 text-[9px] px-2 py-0.5 rounded-md flex items-center gap-0.5"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">Total Gastado</p>
                      <p className="font-bold text-slate-100 text-sm mt-0.5">
                        ${client.totalSpent.toLocaleString('es-ES')}
                      </p>
                      <p className="text-[10px] text-blue-400 mt-0.5 font-medium">
                        {client.loyaltyPoints} Pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Passenger Single Profile Pane (Ficha Única - Right in Desktop / Overlay in Mobile) */}
        {selectedClientId && (
          <div className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:col-span-5 lg:sticky lg:top-6 bg-slate-900 border-t lg:border border-slate-800 lg:rounded-3xl overflow-hidden shadow-2xl animate-fade-in w-full flex flex-col h-full lg:h-auto">
            {/* Header of Detail Pane */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-4 bg-slate-900/40">
              <button
                onClick={() => {
                  setSelectedClientId('')
                  setSelectedClientDetail(null)
                  updateUrlParams({ clientId: '' })
                }}
                className="lg:hidden p-2 text-slate-400 hover:text-slate-100 bg-slate-800/60 rounded-xl cursor-pointer"
                aria-label="Volver a la lista"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Ficha Única de Pasajero</p>
                <h3 className="font-bold text-lg text-slate-100 truncate mt-0.5">
                  {loadingDetail ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-blue-500" />
                      Cargando...
                    </span>
                  ) : selectedClientDetail ? (
                    `${selectedClientDetail.firstName} ${selectedClientDetail.lastName}`
                  ) : (
                    'Detalles'
                  )}
                </h3>
              </div>

              {selectedClientDetail && !loadingDetail && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </button>
              )}
            </div>

            {/* Profile Body */}
            {loadingDetail ? (
              <div className="p-6 space-y-6 flex-1">
                <div className="animate-pulse space-y-6">
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-4 h-24">
                    <div className="bg-slate-800/50 rounded-xl"></div>
                    <div className="bg-slate-800/50 rounded-xl"></div>
                  </div>
                  <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
                  <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
                </div>
              </div>
            ) : selectedClientDetail ? (
              <div className="p-6 space-y-6 flex-1 lg:flex-none lg:max-h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar">
                {/* Profile Bio summary */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nacionalidad</p>
                    <p className="text-xs text-slate-200 mt-0.5 font-semibold">{selectedClientDetail.nationality || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pasaporte</p>
                    <p className="text-xs text-slate-200 mt-0.5 font-semibold">
                      {selectedClientDetail.passportNumber || '-'}{' '}
                      {selectedClientDetail.passportExpiry && (
                        <span className="text-[10px] text-slate-500 block">
                          Vence: {new Date(selectedClientDetail.passportExpiry).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tipo Viajero</p>
                    <p className="text-xs text-slate-200 mt-0.5 font-semibold uppercase">{selectedClientDetail.travelerType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">F. Nacimiento</p>
                    <p className="text-xs text-slate-200 mt-0.5 font-semibold">
                      {selectedClientDetail.birthDate ? new Date(selectedClientDetail.birthDate).toLocaleDateString('es-ES') : '-'}
                    </p>
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    <Compass className="h-4.5 w-4.5 text-blue-400" />
                    <span>Preferencias de Viaje</span>
                  </h4>
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3.5 text-xs">
                    {selectedClientDetail.preferences ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-slate-500 font-medium">Asiento preferido</p>
                            <p className="text-slate-200 font-semibold mt-0.5">
                              {JSON.parse(JSON.stringify(selectedClientDetail.preferences)).seatType === 'WINDOW'
                                ? 'Ventana'
                                : JSON.parse(JSON.stringify(selectedClientDetail.preferences)).seatType === 'AISLE'
                                ? 'Pasillo'
                                : 'Cualquiera'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium">Comida preferida</p>
                            <p className="text-slate-200 font-semibold mt-0.5">
                              {JSON.parse(JSON.stringify(selectedClientDetail.preferences)).mealType || 'Estándar'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Cadenas Hoteleras</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {JSON.parse(JSON.stringify(selectedClientDetail.preferences)).hotelChains?.length > 0 ? (
                              JSON.parse(JSON.stringify(selectedClientDetail.preferences)).hotelChains.map((h: string) => (
                                <span key={h} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                                  {h}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 italic text-[10px]">Ninguna especificada</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium text-red-400/90">Alergias / Restricciones médicas</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {JSON.parse(JSON.stringify(selectedClientDetail.preferences)).allergies?.length > 0 ? (
                              JSON.parse(JSON.stringify(selectedClientDetail.preferences)).allergies.map((a: string) => (
                                <span
                                  key={a}
                                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-semibold"
                                >
                                  {a}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 italic text-[10px]">Ninguna</span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-500 italic text-center py-2">Sin preferencias registradas</p>
                    )}
                  </div>
                </div>

                {/* Travel History */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    <Plane className="h-4.5 w-4.5 text-indigo-400 rotate-45" />
                    <span>Historial de Viajes</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedClientDetail.travelHistory && selectedClientDetail.travelHistory.length > 0 ? (
                      selectedClientDetail.travelHistory.map((history: any) => (
                        <div
                          key={history.id}
                          className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between text-xs hover:border-slate-700 transition"
                        >
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-200">{history.destination}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(history.departureDate).toLocaleDateString('es-ES')} -{' '}
                                {new Date(history.returnDate).toLocaleDateString('es-ES')}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-100">${history.totalPaid.toLocaleString('es-ES')}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{history.currency}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-950/10 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500 italic">
                        Sin viajes registrados en el historial
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactions Timeline */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    <Clock className="h-4.5 w-4.5 text-blue-400" />
                    <span>Línea de Tiempo de Contactos</span>
                  </h4>
                  <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-4 text-xs">
                    {selectedClientDetail.interactions && selectedClientDetail.interactions.length > 0 ? (
                      selectedClientDetail.interactions.map((interaction: any) => (
                        <div key={interaction.id} className="relative">
                          {/* Timeline node icon */}
                          <div className="absolute -left-[22.5px] top-0.5 h-4 w-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[8px] text-slate-300">
                            {interaction.channel === 'WHATSAPP' ? 'WA' : interaction.channel === 'EMAIL' ? 'EM' : 'NT'}
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-200">{interaction.subject}</span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(interaction.occurredAt).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <p className="text-slate-400 leading-relaxed">{interaction.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 italic py-2">Sin interacciones registradas</div>
                    )}
                  </div>
                </div>

                {/* Document Files list */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    <FileText className="h-4.5 w-4.5 text-emerald-400" />
                    <span>Documentación del Pasajero</span>
                  </h4>
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3.5 text-xs">
                    {selectedClientDetail.documentFiles && Array.isArray(JSON.parse(JSON.stringify(selectedClientDetail.documentFiles))) && JSON.parse(JSON.stringify(selectedClientDetail.documentFiles)).length > 0 ? (
                      JSON.parse(JSON.stringify(selectedClientDetail.documentFiles)).map((doc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-800/80 pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-semibold text-slate-200">{doc.tipo}</p>
                            {doc.expiryDate && (
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                Expiración: {new Date(doc.expiryDate).toLocaleDateString('es-ES')}
                              </p>
                            )}
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            Descargar
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic text-center py-2">Sin archivos de documentación</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">
                Seleccione un pasajero del listado para ver su ficha completa.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog for Creating Passenger */}
      {showCreate && (
        <ClientFormDialog
          onClose={() => {
            setShowCreate(false)
            const url = new URL(window.location.href)
            url.searchParams.delete('create')
            window.history.replaceState(null, '', url.pathname + url.search)
          }}
          onSuccess={(newClient) => {
            setShowCreate(false)
            const url = new URL(window.location.href)
            url.searchParams.delete('create')
            window.history.replaceState(null, '', url.pathname + url.search)
            
            if (newClient) {
              // Add to clients state instantly (Optimistic update)
              setClients((prev) => {
                if (prev.some((c) => c.id === newClient.id)) return prev
                const updated = [...prev, newClient]
                return updated.sort((a, b) => {
                  const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
                  const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
                  return nameA.localeCompare(nameB)
                })
              })
              
              // Auto-select the newly created passenger
              setSelectedClientId(newClient.id)
              setSelectedClientDetail(newClient)
              
              // Update URL params to point to new client
              const detailUrl = new URL(window.location.href)
              detailUrl.searchParams.delete('create')
              detailUrl.searchParams.set('clientId', newClient.id)
              window.history.replaceState(null, '', detailUrl.pathname + detailUrl.search)
              
              setSuccessMessage(`Pasajero "${newClient.firstName} ${newClient.lastName}" registrado con éxito e incorporado al listado.`)
            } else {
              setSuccessMessage("Pasajero registrado con éxito.")
            }
            
            setTimeout(() => {
              setSuccessMessage(null)
            }, 6000)
            
            router.refresh()
          }}
        />
      )}

      {/* Dialog for Editing Passenger */}
      {showEdit && selectedClientDetail && (
        <ClientFormDialog
          client={selectedClientDetail}
          onClose={() => setShowEdit(false)}
          onSuccess={(updatedClient) => {
            setShowEdit(false)
            if (updatedClient) {
              // Update client in list locally (Optimistic update)
              setClients((prev) =>
                prev.map((c) => (c.id === updatedClient.id ? { ...c, ...updatedClient } : c))
              )
              // Update selected client detail locally
              setSelectedClientDetail(updatedClient)
              
              setSuccessMessage(`Ficha de "${updatedClient.firstName} ${updatedClient.lastName}" actualizada con éxito.`)
            } else {
              setSuccessMessage("Ficha de pasajero actualizada con éxito.")
            }
            
            setTimeout(() => {
              setSuccessMessage(null)
            }, 6000)
            
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
