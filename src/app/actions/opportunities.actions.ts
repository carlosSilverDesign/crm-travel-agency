'use server'

import {
  createOpportunity as dbCreateOpportunity,
  updateOpportunityStage as dbUpdateOpportunityStage,
} from '@/modules/opportunities/mutations'
import { opportunitySchema, OpportunitySchemaType } from '@/lib/validations/opportunities.schema'
import { OpportunityStage } from '@prisma/client'
import { revalidatePath } from 'next/cache'

/**
 * Server Action para crear una oportunidad
 */
export async function createOpportunityAction(data: OpportunitySchemaType) {
  const parsed = opportunitySchema.safeParse(data)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ')
    return { success: false, error: `Validación fallida: ${errorMsg}` }
  }

  const result = await dbCreateOpportunity(parsed.data)
  if (result.success) {
    revalidatePath('/dashboard/opportunities')
    revalidatePath('/dashboard')
  }
  return result
}

/**
 * Server Action para actualizar la etapa de una oportunidad
 */
export async function updateOpportunityStageAction(id: string, stage: OpportunityStage) {
  if (!id || !stage) {
    return { success: false, error: 'ID y Etapa requeridos.' }
  }

  const result = await dbUpdateOpportunityStage(id, stage)
  if (result.success) {
    revalidatePath('/dashboard/opportunities')
    revalidatePath('/dashboard/clients')
    revalidatePath('/dashboard')
  }
  return result
}
