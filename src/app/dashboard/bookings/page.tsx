export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { getBookings, getProviderPayments, getActiveIncidents } from '@/modules/bookings/queries'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Briefcase,
  AlertOctagon,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  User,
  Plane,
  Plus,
  Send,
  HelpCircle,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import IncidentsBoard from './IncidentsBoard'

// Seed mock bookings, payments, and incidents if empty
async function ensureSeedBookings() {
  const bookingsCount = await prisma.booking.count()
  if (bookingsCount === 0) {
    const clients = await prisma.client.findMany()
    const user = await prisma.user.findFirst()
    const provider = await prisma.provider.findFirst()
    const opp = await prisma.opportunity.findFirst({ where: { stage: 'BOOKED' } })

    if (clients.length > 0 && user && provider && opp) {
      const ana = clients.find((c) => c.firstName === 'Ana')
      const carlos = clients.find((c) => c.firstName === 'Carlos')

      if (ana) {
        // Create booking
        const travelDates = {
          departureDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
          returnDate: new Date(new Date().setDate(new Date().getDate() + 17)).toISOString(),
        }

        const booking = await prisma.booking.create({
          data: {
            opportunityId: opp.id,
            clientId: ana.id,
            status: 'PAYING',
            totalAmount: 8300.0,
            currency: 'USD',
            depositAmount: 1660.0,
            depositDueDate: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago
            balanceDueDate: new Date(new Date().setDate(new Date().getDate() + 4)), // due in 4 days
            confirmationCode: 'DISNEY2026',
            travelDates: travelDates as any,
            documents: ['https://supabase.co/storage/v1/object/public/docs/disney_vouchers.pdf'],
          },
        })

        // Add passengers
        await prisma.passenger.createMany({
          data: [
            {
              bookingId: booking.id,
              clientId: ana.id,
              firstName: 'Ana',
              lastName: 'Martínez',
              passportNumber: 'SP5556667',
              seatPreference: 'WINDOW',
            },
            {
              bookingId: booking.id,
              firstName: 'Pedro',
              lastName: 'García',
              passportNumber: 'SP7778889',
              seatPreference: 'AISLE',
            },
          ],
        })

        const dueRed = new Date()
        dueRed.setDate(dueRed.getDate() + 2) // 2 days from now (Red: < 3 days)

        const dueGreen = new Date()
        dueGreen.setDate(dueGreen.getDate() + 12) // 12 days from now (Green: > 7 days)

        const dueYellow = new Date()
        dueYellow.setDate(dueYellow.getDate() + 5) // 5 days from now (Yellow: 3-7 days)

        // Add provider payments (liquidaciones)
        await prisma.providerPayment.createMany({
          data: [
            {
              bookingId: booking.id,
              providerId: provider.id,
              amount: 4000.0,
              currency: 'USD',
              dueDate: dueRed,
              status: 'PENDING',
              reference: 'EXP-DISNEY-FLIGHT',
            },
            {
              bookingId: booking.id,
              providerId: provider.id,
              amount: 3000.0,
              currency: 'USD',
              dueDate: dueGreen,
              status: 'PENDING',
              reference: 'MAR-DISNEY-HOTEL',
            },
            {
              bookingId: booking.id,
              providerId: provider.id,
              amount: 1300.0,
              currency: 'USD',
              dueDate: dueYellow,
              status: 'PENDING',
              reference: 'EP-DISNEY-TICKETS',
            },
          ],
        })

        // Add incident for Carlos
        if (carlos) {
          const corporateBooking = await prisma.booking.create({
            data: {
              clientId: carlos.id,
              status: 'OPERATING',
              totalAmount: 2500.0,
              currency: 'USD',
              confirmationCode: 'MAD-CORP',
              travelDates: JSON.stringify({
                departureDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
                returnDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
              }),
            },
          })

          await prisma.incident.create({
            data: {
              bookingId: corporateBooking.id,
              type: 'Pérdida de Equipaje',
              description: 'Vuelo de Iberia IB314. El equipaje de mano fue despachado a bodega y no aparece en la cinta de Barajas.',
              status: 'OPEN',
              priority: 'HIGH',
              agentId: user.id,
            },
          })
        }
      }
    }
  }
}

export default async function BookingsPage() {
  await ensureSeedBookings()

  const bookingsRes = await getBookings()
  const paymentsRes = await getProviderPayments()
  const incidentsRes = await getActiveIncidents()

  const bookings = bookingsRes.success && bookingsRes.data ? bookingsRes.data : []
  const payments = paymentsRes.success && paymentsRes.data ? paymentsRes.data : []
  const incidents = incidentsRes.success && incidentsRes.data ? incidentsRes.data : []

  // Helper to get traffic light color for payment due date
  const getTrafficLight = (payment: any) => {
    if (payment.status === 'PAID') return { color: 'border-slate-800 bg-slate-900 text-slate-500', label: 'Liquidado' }

    const daysLeft = Math.ceil(
      (new Date(payment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysLeft < 0) {
      return {
        color: 'border-red-500/20 bg-red-500/10 text-red-400 font-bold',
        label: `VENCIDO (${Math.abs(daysLeft)}d)`,
      }
    }
    if (daysLeft < 3) {
      return {
        color: 'border-red-500/20 bg-red-500/10 text-red-400 font-bold',
        label: `Vence en ${daysLeft}d (Crítico)`,
      }
    }
    if (daysLeft <= 7) {
      return {
        color: 'border-amber-500/20 bg-amber-500/10 text-amber-400 font-semibold',
        label: `Vence en ${daysLeft}d (Próximo)`,
      }
    }
    return {
      color: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-medium',
      label: `Vence en ${daysLeft}d (Al día)`,
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Supplier Payments (Liquidaciones Traffic Light UI) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <span>Control de Liquidaciones a Proveedores</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-medium">Semáforo UI de Vencimientos</span>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No hay liquidaciones de proveedores pendientes de pago.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/20">
                  <th className="p-4 pl-6">Proveedor / Ref</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Monto</th>
                  <th className="p-4">Vence el</th>
                  <th className="p-4">Semáforo Vencimiento</th>
                  <th className="p-4 pr-6 text-right font-bold">Estado Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {payments.map((p) => {
                  const traffic = getTrafficLight(p)
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/20 transition">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-200">{p.provider.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Ref: {p.reference || 'N/D'}</div>
                      </td>
                      <td className="p-4 text-slate-300">
                        {p.booking.client.firstName} {p.booking.client.lastName}
                      </td>
                      <td className="p-4 text-slate-200 font-bold">
                        ${p.amount.toLocaleString()} <span className="text-[10px] text-slate-500">{p.currency}</span>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(p.dueDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg border text-[9px] uppercase tracking-wider ${traffic.color}`}>
                          {traffic.label}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {p.status === 'PENDING' ? (
                          <Link
                            href={`/api/public/payments/pay?id=${p.id}`}
                            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-3 py-1.5 text-[10px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Registrar Pago</span>
                          </Link>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1 justify-end text-[10px]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-slate-600" />
                            <span>Pagado</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Destination Incidents Management Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Incidents Board (Left 5 cols in Desktop) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-rose-500" />
              <span>Incidencias en Destino</span>
            </h3>
            <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded">
              {incidents.length} Activas
            </span>
          </div>

          <IncidentsBoard initialIncidents={incidents as any} bookings={bookings as any} />
        </div>

        {/* Confirmed Passenger Manifests (Right 7 cols in Desktop) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-400" />
              <span>Manifiesto de Pasajeros y Reservas</span>
            </h3>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-12">
              No hay reservas registradas en el sistema.
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => {
                const dates = b.travelDates ? JSON.parse(JSON.stringify(b.travelDates)) : null
                return (
                  <div key={b.id} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3">
                    {/* Booking header details */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-slate-200">
                          Reserva: {b.confirmationCode || `ID-${b.id.substring(0, 6)}`}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Cliente titular: {b.client.firstName} {b.client.lastName}
                        </p>
                      </div>
                      <span className="bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {b.status}
                      </span>
                    </div>

                    {/* Passenger Manifest sub-list */}
                    <div className="space-y-2 border-t border-slate-800/80 pt-3">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manifiesto Pasajeros</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {b.passengers.map((p) => (
                          <div key={p.id} className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-slate-200 truncate">
                                {p.firstName} {p.lastName}
                              </p>
                              {p.passportNumber && (
                                <p className="text-[9px] text-slate-500 truncate">Paso: {p.passportNumber}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dates and pricing footer details */}
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/60 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>
                          {dates?.departureDate ? new Date(dates.departureDate).toLocaleDateString() : 'Por definir'}
                        </span>
                      </span>
                      <span className="font-bold text-slate-200">
                        Total Reserva: ${b.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
