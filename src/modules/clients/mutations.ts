import prisma from '@/lib/prisma'
import { ClientSchemaType } from '@/lib/validations/clients.schema'

/**
 * Crear un nuevo cliente (Ficha Única de Pasajero)
 */
export async function createClient(data: ClientSchemaType) {
  try {
    const client = await prisma.client.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        nationality: data.nationality,
        passportNumber: data.passportNumber,
        passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : null,
        documentFiles: data.documentFiles ? (data.documentFiles as any) : [],
        preferences: data.preferences ? (data.preferences as any) : {},
        travelerType: data.travelerType,
        loyaltyPoints: data.loyaltyPoints || 0,
        totalSpent: data.totalSpent || 0.0,
        assignedAgentId: data.assignedAgentId,
        tags: data.tags || [],
        notes: data.notes,
      },
    })
    return { success: true, data: client }
  } catch (error: any) {
    console.error('Error creating client:', error)
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe un cliente con este correo electrónico.' }
    }
    return { success: false, error: 'Error al registrar el cliente en la base de datos.' }
  }
}

/**
 * Actualizar datos de un cliente existente
 */
export async function updateClient(id: string, data: Partial<ClientSchemaType>) {
  try {
    const updateData: any = { ...data }

    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null
    }
    if (data.passportExpiry !== undefined) {
      updateData.passportExpiry = data.passportExpiry ? new Date(data.passportExpiry) : null
    }
    if (data.documentFiles) {
      updateData.documentFiles = data.documentFiles as any
    }
    if (data.preferences) {
      updateData.preferences = data.preferences as any
    }

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    })
    return { success: true, data: client }
  } catch (error: any) {
    console.error('Error updating client:', error)
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe un cliente con este correo electrónico.' }
    }
    return { success: false, error: 'Error al actualizar los datos del cliente.' }
  }
}

/**
 * Eliminar un cliente de la base de datos
 */
export async function deleteClient(id: string) {
  try {
    await prisma.client.delete({
      where: { id },
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting client:', error)
    return { success: false, error: 'Error al eliminar el cliente de la base de datos.' }
  }
}

/**
 * Recalcular totalSpent y loyaltyPoints automáticamente al cerrar o pagar reservas
 */
export async function updateClientStats(clientId: string) {
  try {
    // Buscar reservas PAGADAS o COMPLETADAS de este cliente
    const bookings = await prisma.booking.findMany({
      where: {
        clientId,
        status: {
          in: ['PAID', 'COMPLETED'],
        },
      },
      select: {
        totalAmount: true,
      },
    })

    const totalSpent = bookings.reduce((sum, b) => sum + b.totalAmount, 0)
    // 1 punto por cada 10 USD (u otra unidad) gastados
    const loyaltyPoints = Math.floor(totalSpent / 10)

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        totalSpent,
        loyaltyPoints,
      },
    })

    return { success: true, data: updatedClient }
  } catch (error: any) {
    console.error('Error updating client stats:', error)
    return { success: false, error: 'Error al recalcular estadísticas del cliente.' }
  }
}
