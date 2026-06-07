import prisma from '@/lib/prisma'
import { TravelerType } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'

export interface GetClientsParams {
  search?: string
  travelerType?: TravelerType
  tag?: string
  agentId?: string
  page?: number
  pageSize?: number
}

/**
 * Obtener listado de clientes paginado y filtrado
 */
export async function getClients(params: GetClientsParams) {
  const {
    search,
    travelerType,
    tag,
    agentId,
    page = 1,
    pageSize = 10,
  } = params

  const skip = (page - 1) * pageSize

  // Build where conditions
  const where: any = {}

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (travelerType) {
    where.travelerType = travelerType
  }

  if (tag) {
    where.tags = {
      has: tag,
    }
  }

  // Aislamiento comercial para agentes (Counters)
  const user = await getCurrentUser()
  if (user && user.role === 'AGENT') {
    where.assignedAgentId = user.id
  } else if (agentId) {
    where.assignedAgentId = agentId
  }

  try {
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { lastName: 'asc' },
        include: {
          assignedAgent: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ])

    return {
      success: true,
      data: {
        clients,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    }
  } catch (error: any) {
    console.error('Error fetching clients:', error)
    return {
      success: false,
      error: 'Error al obtener los clientes de la base de datos.',
    }
  }
}

/**
 * Obtener la Ficha Única del Pasajero con todo su historial
 */
export async function getClientById(id: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        assignedAgent: {
          select: { id: true, name: true, email: true },
        },
        travelHistory: {
          orderBy: { departureDate: 'desc' },
        },
        opportunities: {
          orderBy: { updatedAt: 'desc' },
        },
        bookings: {
          orderBy: { createdAt: 'desc' },
        },
        interactions: {
          orderBy: { occurredAt: 'desc' },
        },
      },
    })

    if (!client) {
      return { success: false, error: 'Cliente no encontrado.' }
    }

    // Aislamiento comercial para agentes (Counters)
    const user = await getCurrentUser()
    if (user && user.role === 'AGENT' && client.assignedAgentId !== user.id) {
      return { success: false, error: 'Acceso denegado. Este cliente no está en su cartera de clientes.' }
    }

    return {
      success: true,
      data: client,
    }
  } catch (error: any) {
    console.error('Error fetching client by id:', error)
    return {
      success: false,
      error: 'Error al cargar la ficha única del pasajero.',
    }
  }
}

/**
 * Obtener alertas de pasaportes vencidos o por vencer en menos de 90 días
 */
export async function getPassportExpiryAlerts(agentId?: string) {
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

  const where: any = {
    passportExpiry: {
      lte: ninetyDaysFromNow,
    },
  }

  // Aislamiento comercial para agentes (Counters)
  const user = await getCurrentUser()
  if (user && user.role === 'AGENT') {
    where.assignedAgentId = user.id
  } else if (agentId) {
    where.assignedAgentId = agentId
  }

  try {
    const clients = await prisma.client.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        passportNumber: true,
        passportExpiry: true,
        assignedAgentId: true,
      },
      orderBy: { passportExpiry: 'asc' },
    })

    return {
      success: true,
      data: clients,
    }
  } catch (error: any) {
    console.error('Error fetching passport alerts:', error)
    return {
      success: false,
      error: 'Error al cargar las alertas de pasaportes.',
    }
  }
}
