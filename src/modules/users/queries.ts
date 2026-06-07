import prisma from '@/lib/prisma'

/**
 * Obtener listado de todos los usuarios con estadísticas de cartera
 */
export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            clients: true,
            opportunities: true,
          },
        },
        clients: {
          select: {
            totalSpent: true,
          },
        },
      },
    })

    const mapped = users.map((u) => {
      const portfolioLtv = u.clients.reduce((sum, c) => sum + c.totalSpent, 0)
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        clientCount: u._count.clients,
        oppCount: u._count.opportunities,
        portfolioLtv,
      }
    })

    return { success: true, data: mapped }
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return { success: false, error: 'Error al obtener la lista de usuarios.' }
  }
}

/**
 * Obtener listado simplificado de asesores activos para asignación
 */
export async function getActiveAgents() {
  try {
    const agents = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    })
    return { success: true, data: agents }
  } catch (error: any) {
    console.error('Error fetching active agents:', error)
    return { success: false, error: 'Error al obtener la lista de agentes activos.' }
  }
}
