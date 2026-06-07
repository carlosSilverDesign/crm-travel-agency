import prisma from '@/lib/prisma'

/**
 * Obtener reservas confirmadas y activas con información de clientes, pagos e incidencias
 */
export async function getBookings() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        opportunity: {
          select: { id: true, title: true },
        },
        passengers: true,
        incidents: {
          orderBy: { createdAt: 'desc' },
        },
        providerPayments: {
          include: {
            provider: true,
          },
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: bookings }
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return { success: false, error: 'Error al obtener las reservas de la base de datos.' }
  }
}

/**
 * Obtener todos los pagos a proveedores (liquidaciones) para el control administrativo
 */
export async function getProviderPayments() {
  try {
    const payments = await prisma.providerPayment.findMany({
      include: {
        provider: true,
        booking: {
          include: {
            client: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return { success: true, data: payments }
  } catch (error: any) {
    console.error('Error fetching provider payments:', error)
    return { success: false, error: 'Error al obtener las liquidaciones de proveedores.' }
  }
}

/**
 * Obtener incidencias activas en destino
 */
export async function getActiveIncidents() {
  try {
    const incidents = await prisma.incident.findMany({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'],
        },
      },
      include: {
        booking: {
          include: {
            client: {
              select: { id: true, firstName: true, lastName: true, phone: true },
            },
          },
        },
      },
      orderBy: { priority: 'desc' },
    })

    return { success: true, data: incidents }
  } catch (error: any) {
    console.error('Error fetching active incidents:', error)
    return { success: false, error: 'Error al obtener las incidencias de la base de datos.' }
  }
}
