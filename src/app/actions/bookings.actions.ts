'use server'

import {
  createIncident as dbCreateIncident,
  resolveIncident as dbResolveIncident,
  updateProviderPaymentStatus as dbUpdateProviderPaymentStatus,
} from '@/modules/bookings/mutations'
import { IncidentPriority, ProviderPaymentStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

/**
 * Server Action para registrar una incidencia en viaje
 */
export async function createIncidentAction(params: {
  bookingId: string
  type: string
  description: string
  priority: IncidentPriority
}) {
  if (!params.bookingId || !params.type || !params.description) {
    return { success: false, error: 'Complete todos los campos requeridos.' }
  }

  const result = await dbCreateIncident({
    ...params,
    agentId: 'mock-agent-id', // overridden on backend/db query if needed
  })

  if (result.success) {
    revalidatePath('/dashboard/bookings')
    revalidatePath('/dashboard/clients')
  }
  return result
}

/**
 * Server Action para resolver una incidencia
 */
export async function resolveIncidentAction(id: string, resolution: string) {
  if (!id || !resolution) {
    return { success: false, error: 'Detalle de resolución y ID requeridos.' }
  }

  const result = await dbResolveIncident(id, resolution, 'mock-agent-id')
  if (result.success) {
    revalidatePath('/dashboard/bookings')
    revalidatePath('/dashboard/clients')
  }
  return result
}

/**
 * Server Action para liquidar un pago a proveedor
 */
export async function updateProviderPaymentStatusAction(
  paymentId: string,
  status: ProviderPaymentStatus,
  reference?: string
) {
  if (!paymentId || !status) {
    return { success: false, error: 'ID de pago y estado requeridos.' }
  }

  const result = await dbUpdateProviderPaymentStatus(paymentId, status, reference)
  if (result.success) {
    revalidatePath('/dashboard/bookings')
  }
  return result
}
