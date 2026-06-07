import prisma from '@/lib/prisma'

/**
 * Obtener listado de cotizaciones
 */
export async function getQuotes(opportunityId?: string) {
  try {
    const where: any = {}
    if (opportunityId) {
      where.opportunityId = opportunityId
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        opportunity: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: quotes }
  } catch (error: any) {
    console.error('Error fetching quotes:', error)
    return { success: false, error: 'Error al obtener las cotizaciones.' }
  }
}

/**
 * Obtener detalle completo de una cotización
 */
export async function getQuoteById(id: string) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        opportunity: true,
        agent: true,
        items: {
          include: {
            provider: true,
          },
        },
      },
    })

    if (!quote) {
      return { success: false, error: 'Cotización no encontrada.' }
    }

    return { success: true, data: quote }
  } catch (error: any) {
    console.error('Error fetching quote by id:', error)
    return { success: false, error: 'Error al cargar la cotización de la base de datos.' }
  }
}
