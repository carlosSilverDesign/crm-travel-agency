export const dynamic = 'force-dynamic'

import { getClients, getPassportExpiryAlerts, getClientById } from '@/modules/clients/queries'
import prisma from '@/lib/prisma'
import { TravelerType } from '@prisma/client'
import ClientsDashboardClient from './ClientsDashboardClient'

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

  return (
    <ClientsDashboardClient
      initialClients={clients as any}
      alerts={alerts}
      initialSelectedClientId={selectedClientId}
      initialSelectedClient={selectedClient}
      initialQuery={query}
      initialTypeFilter={typeFilter}
      initialShowCreate={showCreate}
    />
  )
}
