'use server'

import {
  createClient as dbCreateClient,
  updateClient as dbUpdateClient,
  deleteClient as dbDeleteClient,
} from '@/modules/clients/mutations'
import { getClientById } from '@/modules/clients/queries'
import { clientSchema, ClientSchemaType } from '@/lib/validations/clients.schema'
import { revalidatePath } from 'next/cache'

/**
 * Server Action para crear un cliente
 */
export async function createClientAction(data: ClientSchemaType) {
  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ')
    return { success: false, error: `Validación fallida: ${errorMsg}` }
  }

  const result = await dbCreateClient(parsed.data)
  if (result.success) {
    revalidatePath('/dashboard/clients')
  }
  return result
}

/**
 * Server Action para actualizar un cliente
 */
export async function updateClientAction(id: string, data: Partial<ClientSchemaType>) {
  const parsed = clientSchema.partial().safeParse(data)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ')
    return { success: false, error: `Validación fallida: ${errorMsg}` }
  }

  const result = await dbUpdateClient(id, parsed.data)
  if (result.success) {
    revalidatePath('/dashboard/clients')
    revalidatePath(`/dashboard/clients/${id}`)
  }
  return result
}

/**
 * Server Action para eliminar un cliente
 */
export async function deleteClientAction(id: string) {
  if (!id) {
    return { success: false, error: 'ID de cliente requerido.' }
  }

  const result = await dbDeleteClient(id)
  if (result.success) {
    revalidatePath('/dashboard/clients')
  }
  return result
}

/**
 * Server Action para obtener la Ficha Única del Pasajero con todo su historial
 */
export async function getClientDetailAction(id: string) {
  if (!id) {
    return { success: false, error: 'ID de cliente requerido.' }
  }
  return await getClientById(id)
}

