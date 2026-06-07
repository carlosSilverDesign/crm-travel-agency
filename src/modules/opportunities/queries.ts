import prisma from '@/lib/prisma'

/**
 * Obtener listado de oportunidades con clientes y agentes incluidos
 */
export async function getOpportunities(agentId?: string) {
  try {
    const where: any = {}
    if (agentId) {
      where.agentId = agentId
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            travelerType: true,
            totalSpent: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return { success: true, data: opportunities }
  } catch (error: any) {
    console.error('Error fetching opportunities:', error)
    return { success: false, error: 'Error al obtener las oportunidades.' }
  }
}

/**
 * Obtener detalle de una oportunidad
 */
export async function getOpportunityById(id: string) {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        client: true,
        agent: {
          select: { id: true, name: true, email: true },
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!opportunity) {
      return { success: false, error: 'Oportunidad no encontrada.' }
    }

    return { success: true, data: opportunity }
  } catch (error: any) {
    console.error('Error fetching opportunity by id:', error)
    return { success: false, error: 'Error al cargar el detalle de la oportunidad.' }
  }
}
