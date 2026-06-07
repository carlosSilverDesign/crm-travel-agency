export const dynamic = 'force-dynamic'

import { getClients, getPassportExpiryAlerts, getClientById } from '@/modules/clients/queries'
import { getClients as dbGetClients } from '@/modules/clients/queries'
import prisma from '@/lib/prisma'
import { TravelerType, OpportunityStage } from '@prisma/client'
import Link from 'next/link'
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
  MessageSquare,
  FileText,
  UserCheck,
  Plane,
} from 'lucide-react'
import ClientFormDialog from './ClientFormDialog'

// Seed mock data if database is empty
async function ensureSeedData() {
  const count = await prisma.client.count()
  if (count === 0) {
    // Let's create a mock agent user
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Asesor Demo',
          email: 'asesor@travel.com',
          role: 'AGENT',
        },
      })
    }

    const passportExpirySoon = new Date()
    passportExpirySoon.setDate(passportExpirySoon.getDate() + 45) // 45 days

    const passportExpired = new Date()
    passportExpired.setDate(passportExpired.getDate() - 10) // 10 days ago

    const passportOk = new Date()
    passportOk.setDate(passportOk.getDate() + 720) // ok

    // Create 4 mock clients
    await prisma.client.createMany({
      data: [
        {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@email.com',
          phone: '+34 612 345 678',
          birthDate: new Date('1985-05-15'),
          nationality: 'Española',
          passportNumber: 'SP1234567',
          passportExpiry: passportExpirySoon,
          travelerType: 'SOLO',
          loyaltyPoints: 540,
          totalSpent: 5400.00,
          assignedAgentId: user.id,
          tags: ['vip', 'recurrent'],
          notes: 'Prefiere viajar en clase ejecutiva y prefiere asiento de ventana.',
          preferences: JSON.stringify({
            seatType: 'WINDOW',
            mealType: 'STANDARD',
            hotelChains: ['Marriott', 'Hilton'],
            allergies: []
          }),
          documentFiles: JSON.stringify([
            { tipo: 'PASAPORTE', url: 'https://supabase.co/storage/v1/object/public/docs/passport_juan.pdf', expiryDate: passportExpirySoon.toISOString() }
          ])
        },
        {
          firstName: 'María',
          lastName: 'Rodríguez',
          email: 'maria.rod@email.com',
          phone: '+34 688 777 999',
          birthDate: new Date('1990-11-20'),
          nationality: 'Española',
          passportNumber: 'SP9876543',
          passportExpiry: passportOk,
          travelerType: 'HONEYMOON',
          loyaltyPoints: 1200,
          totalSpent: 12000.00,
          assignedAgentId: user.id,
          tags: ['premium'],
          notes: 'Viaje de bodas planeado para Maldivas. Muy detallista.',
          preferences: JSON.stringify({
            seatType: 'AISLE',
            mealType: 'VEGETARIAN',
            hotelChains: ['Four Seasons'],
            allergies: ['Gluten']
          }),
          documentFiles: JSON.stringify([
            { tipo: 'PASAPORTE', url: 'https://supabase.co/storage/v1/object/public/docs/passport_maria.pdf', expiryDate: passportOk.toISOString() },
            { tipo: 'VISA_USA', url: 'https://supabase.co/storage/v1/object/public/docs/visa_usa_maria.pdf', expiryDate: '2028-10-15T00:00:00.000Z' }
          ])
        },
        {
          firstName: 'Carlos',
          lastName: 'Gómez',
          email: 'carlos.gomez@empresa.com',
          phone: '+34 622 111 222',
          birthDate: new Date('1978-02-10'),
          nationality: 'Española',
          passportNumber: 'SP2223334',
          passportExpiry: passportExpired,
          travelerType: 'CORPORATE',
          loyaltyPoints: 250,
          totalSpent: 2500.00,
          assignedAgentId: user.id,
          tags: ['business'],
          notes: 'Viajes frecuentes corporativos. Necesita facturación mensual rápida.',
          preferences: JSON.stringify({
            seatType: 'WINDOW',
            mealType: 'STANDARD',
            hotelChains: ['NH Hotels'],
            allergies: []
          }),
          documentFiles: JSON.stringify([])
        },
        {
          firstName: 'Ana',
          lastName: 'Martínez',
          email: 'ana.martinez@family.com',
          phone: '+34 600 400 500',
          birthDate: new Date('1982-08-30'),
          nationality: 'Española',
          passportNumber: 'SP5556667',
          passportExpiry: passportExpirySoon,
          travelerType: 'FAMILY',
          loyaltyPoints: 830,
          totalSpent: 8300.00,
          assignedAgentId: user.id,
          tags: ['recurrent'],
          notes: 'Viaja siempre con su esposo y 2 niños pequeños.',
          preferences: JSON.stringify({
            seatType: 'STANDARD',
            mealType: 'KIDS_MEAL',
            hotelChains: ['Melia'],
            allergies: ['Nuts']
          }),
          documentFiles: JSON.stringify([
            { tipo: 'PASAPORTE', url: 'https://supabase.co/storage/v1/object/public/docs/passport_ana.pdf', expiryDate: passportExpirySoon.toISOString() }
          ])
        }
      ]
    })
    
    // Add mock travel history for Juan Pérez
    const juan = await prisma.client.findFirst({ where: { firstName: 'Juan' } })
    if (juan) {
      await prisma.travelerHistory.createMany({
        data: [
          {
            clientId: juan.id,
            destination: 'París, Francia',
            departureDate: new Date('2025-05-10'),
            returnDate: new Date('2025-05-17'),
            totalPaid: 2400.00,
            currency: 'EUR',
            agentId: user.id
          },
          {
            clientId: juan.id,
            destination: 'Nueva York, USA',
            departureDate: new Date('2025-12-05'),
            returnDate: new Date('2025-12-12'),
            totalPaid: 3000.00,
            currency: 'USD',
            agentId: user.id
          }
        ]
      })

      await prisma.interaction.createMany({
        data: [
          {
            clientId: juan.id,
            channel: 'WHATSAPP',
            direction: 'INBOUND',
            subject: 'Consulta sobre vuelo París',
            content: 'El cliente consulta si el equipaje de mano está incluido en la tarifa de Air France.',
            agentId: user.id,
            occurredAt: new Date('2025-05-01T10:30:00Z')
          },
          {
            clientId: juan.id,
            channel: 'NOTE',
            direction: 'OUTBOUND',
            subject: 'Llamada de postventa París',
            content: 'El cliente regresó encantado del hotel Le Bristol. Recomienda agregarlo a otros paquetes de lujo.',
            agentId: user.id,
            occurredAt: new Date('2025-05-18T16:00:00Z')
          }
        ]
      })
    }
  }
}

interface PageProps {
  searchParams: Promise<{
    q?: string
    type?: TravelerType
    clientId?: string
    create?: string
    edit?: string
  }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  await ensureSeedData()
  
  const params = await searchParams
  const query = params.q || ''
  const typeFilter = params.type || undefined
  const selectedClientId = params.clientId || ''
  const showCreate = params.create === 'true'

  // Fetch data
  const clientsRes = await getClients({
    search: query,
    travelerType: typeFilter,
    pageSize: 100 // load all for simple client filtering
  })
  
  const alertsRes = await getPassportExpiryAlerts()

  const clients = clientsRes.success && clientsRes.data ? clientsRes.data.clients : []
  const alerts = alertsRes.success && alertsRes.data ? alertsRes.data : []

  // If a client is selected, fetch their detailed record
  let selectedClient: any = null
  if (selectedClientId) {
    const detailRes = await getClientById(selectedClientId)
    if (detailRes.success) {
      selectedClient = detailRes.data
    }
  }

  // Calculate stats
  const totalClients = clients.length
  const totalLTV = clients.reduce((sum, c) => sum + c.totalSpent, 0)
  const expiringPassportsCount = alerts.length
  const vipCount = clients.filter(c => c.tags.includes('vip') || c.totalSpent > 5000).length

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:max-w-md">
          <form method="GET" className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Buscar cliente por nombre, email, teléfono..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
            {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
          </form>
        </div>

        <Link
          href="?create=true"
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Nuevo Pasajero</span>
        </Link>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Pasajeros</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalClients}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">LTV Total</p>
            <p className="text-xl font-bold text-white mt-0.5">${totalLTV.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">VIP / Alta Gama</p>
            <p className="text-xl font-bold text-white mt-0.5">{vipCount}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Venc. Pasaporte</p>
            <p className="text-xl font-bold text-white mt-0.5">{expiringPassportsCount}</p>
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
                        {new Date(c.passportExpiry).toLocaleDateString()}
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
        <div className={`lg:col-span-7 space-y-4 ${selectedClient ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {/* Header / Filter Tabs */}
            <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
              <h3 className="font-bold text-base text-white">Listado de Pasajeros</h3>
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <Link
                  href="/dashboard/clients"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    !typeFilter
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos
                </Link>
                {Object.values(TravelerType).map((type) => (
                  <Link
                    key={type}
                    href={`?type=${type}${query ? `&q=${query}` : ''}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      typeFilter === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </Link>
                ))}
              </div>
            </div>

            {/* List */}
            {clients.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No se encontraron pasajeros con los filtros aplicados.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {clients.map((client) => (
                  <Link
                    key={client.id}
                    href={`?clientId=${client.id}${query ? `&q=${query}` : ''}${
                      typeFilter ? `&type=${typeFilter}` : ''
                    }`}
                    className={`flex items-center justify-between p-5 hover:bg-slate-800/40 transition duration-200 ${
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
                      <p className="font-bold text-white text-sm mt-0.5">
                        ${client.totalSpent.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-blue-400 mt-0.5 font-medium">
                        {client.loyaltyPoints} Pts
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Passenger Single Profile Pane (Ficha Única - Right in Desktop / Overlay in Mobile) */}
        {selectedClient && (
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in w-full">
            {/* Header of Detail Pane */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-4 bg-slate-900/40">
              <Link
                href={`/dashboard/clients?${query ? `q=${query}` : ''}${
                  typeFilter ? `&type=${typeFilter}` : ''
                }`}
                className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl"
                aria-label="Volver a la lista"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Ficha Única de Pasajero</p>
                <h3 className="font-bold text-lg text-white truncate mt-0.5">
                  {selectedClient.firstName} {selectedClient.lastName}
                </h3>
              </div>
            </div>

            {/* Profile Body */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar">
              {/* Profile Bio summary */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nacionalidad</p>
                  <p className="text-xs text-slate-200 mt-0.5 font-semibold">{selectedClient.nationality || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pasaporte</p>
                  <p className="text-xs text-slate-200 mt-0.5 font-semibold">
                    {selectedClient.passportNumber || '-'}{' '}
                    {selectedClient.passportExpiry && (
                      <span className="text-[10px] text-slate-500 block">
                        Vence: {new Date(selectedClient.passportExpiry).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tipo Viajero</p>
                  <p className="text-xs text-slate-200 mt-0.5 font-semibold uppercase">{selectedClient.travelerType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">F. Nacimiento</p>
                  <p className="text-xs text-slate-200 mt-0.5 font-semibold">
                    {selectedClient.birthDate ? new Date(selectedClient.birthDate).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Compass className="h-4.5 w-4.5 text-blue-400" />
                  <span>Preferencias de Viaje</span>
                </h4>
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3.5 text-xs">
                  {selectedClient.preferences ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-slate-500 font-medium">Asiento preferido</p>
                          <p className="text-slate-200 font-semibold mt-0.5">
                            {JSON.parse(JSON.stringify(selectedClient.preferences)).seatType === 'WINDOW'
                              ? 'Ventana'
                              : JSON.parse(JSON.stringify(selectedClient.preferences)).seatType === 'AISLE'
                              ? 'Pasillo'
                              : 'Cualquiera'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Comida preferida</p>
                          <p className="text-slate-200 font-semibold mt-0.5">
                            {JSON.parse(JSON.stringify(selectedClient.preferences)).mealType || 'Estándar'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Cadenas Hoteleras</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {JSON.parse(JSON.stringify(selectedClient.preferences)).hotelChains?.length > 0 ? (
                            JSON.parse(JSON.stringify(selectedClient.preferences)).hotelChains.map((h: string) => (
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
                          {JSON.parse(JSON.stringify(selectedClient.preferences)).allergies?.length > 0 ? (
                            JSON.parse(JSON.stringify(selectedClient.preferences)).allergies.map((a: string) => (
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
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Plane className="h-4.5 w-4.5 text-indigo-400 rotate-45" />
                  <span>Historial de Viajes</span>
                </h4>
                <div className="space-y-2">
                  {selectedClient.travelHistory && selectedClient.travelHistory.length > 0 ? (
                    selectedClient.travelHistory.map((history: any) => (
                      <div
                        key={history.id}
                        className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between text-xs hover:border-slate-700 transition"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-200">{history.destination}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(history.departureDate).toLocaleDateString()} -{' '}
                              {new Date(history.returnDate).toLocaleDateString()}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">${history.totalPaid.toLocaleString()}</p>
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
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Clock className="h-4.5 w-4.5 text-blue-400" />
                  <span>Línea de Tiempo de Contactos</span>
                </h4>
                <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-4 text-xs">
                  {selectedClient.interactions && selectedClient.interactions.length > 0 ? (
                    selectedClient.interactions.map((interaction: any) => (
                      <div key={interaction.id} className="relative">
                        {/* Timeline node icon */}
                        <div className="absolute -left-[22.5px] top-0.5 h-4 w-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[8px] text-slate-300">
                          {interaction.channel === 'WHATSAPP' ? 'WA' : interaction.channel === 'EMAIL' ? 'EM' : 'NT'}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-200">{interaction.subject}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(interaction.occurredAt).toLocaleDateString()}
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
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <FileText className="h-4.5 w-4.5 text-emerald-400" />
                  <span>Documentación del Pasajero</span>
                </h4>
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3.5 text-xs">
                  {selectedClient.documentFiles && Array.isArray(JSON.parse(JSON.stringify(selectedClient.documentFiles))) && JSON.parse(JSON.stringify(selectedClient.documentFiles)).length > 0 ? (
                    JSON.parse(JSON.stringify(selectedClient.documentFiles)).map((doc: any, i: number) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-800/80 pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-semibold text-slate-200">{doc.tipo}</p>
                          {doc.expiryDate && (
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              Expiración: {new Date(doc.expiryDate).toLocaleDateString()}
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
          </div>
        )}
      </div>

      {/* Dialog for Creating Passenger */}
      {showCreate && (
        <ClientFormDialog />
      )}
    </div>
  )
}
