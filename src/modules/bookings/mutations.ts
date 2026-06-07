import prisma from '@/lib/prisma'
import { IncidentPriority, IncidentStatus, ProviderPaymentStatus } from '@prisma/client'

/**
 * Registrar una incidencia en destino para una reserva
 */
export async function createIncident(params: {
  bookingId: string
  type: string
  description: string
  priority: IncidentPriority
  agentId?: string
}) {
  try {
    const incident = await prisma.incident.create({
      data: {
        bookingId: params.bookingId,
        type: params.type,
        description: params.description,
        priority: params.priority,
        status: 'OPEN',
        agentId: params.agentId,
      },
      include: {
        booking: {
          select: { clientId: true },
        },
      },
    })

    // Registrar en el timeline de contactos
    await prisma.interaction.create({
      data: {
        clientId: incident.booking.clientId,
        channel: 'NOTE',
        direction: 'INBOUND',
        subject: `Incidencia Registrada: ${params.type}`,
        content: `Nueva incidencia reportada en viaje: "${params.description}". Prioridad: ${params.priority}.`,
        agentId: params.agentId || 'system',
        isAutomatic: true,
      },
    })

    return { success: true, data: incident }
  } catch (error: any) {
    console.error('Error creating incident:', error)
    return { success: false, error: 'Error al registrar la incidencia en viaje.' }
  }
}

/**
 * Resolver una incidencia en destino
 */
export async function resolveIncident(id: string, resolution: string, agentId?: string) {
  try {
    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date(),
      },
      include: {
        booking: {
          select: { clientId: true },
        },
      },
    })

    // Registrar en el timeline
    await prisma.interaction.create({
      data: {
        clientId: incident.booking.clientId,
        channel: 'NOTE',
        direction: 'OUTBOUND',
        subject: 'Incidencia Resuelta',
        content: `Incidencia de tipo "${incident.type}" resuelta. Solución: ${resolution}`,
        agentId: agentId || 'system',
        isAutomatic: true,
      },
    })

    return { success: true, data: incident }
  } catch (error: any) {
    console.error('Error resolving incident:', error)
    return { success: false, error: 'Error al actualizar el estado de la incidencia.' }
  }
}

/**
 * Registrar el pago o cambio de estado de una liquidación a proveedor
 */
export async function updateProviderPaymentStatus(
  paymentId: string,
  status: ProviderPaymentStatus,
  reference?: string
) {
  try {
    const payment = await prisma.providerPayment.update({
      where: { id: paymentId },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : null,
        reference: reference || undefined,
      },
    })

    return { success: true, data: payment }
  } catch (error: any) {
    console.error('Error updating provider payment status:', error)
    return { success: false, error: 'Error al actualizar el pago del proveedor.' }
  }
}
