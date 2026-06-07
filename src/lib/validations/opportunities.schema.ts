import { z } from 'zod'
import { OpportunityStage, OpportunitySource } from '@prisma/client'

export const opportunitySchema = z.object({
  clientId: z.string().min(1, 'El cliente es requerido'),
  agentId: z.string().min(1, 'El asesor es requerido'),
  title: z.string().min(1, 'El título es requerido'),
  stage: z.nativeEnum(OpportunityStage).default(OpportunityStage.PROSPECT),
  estimatedValue: z.number().min(0, 'El valor estimado debe ser mayor o igual a 0'),
  currency: z.string().default('USD'),
  probability: z.number().int().min(0).max(100).default(10),
  closeDate: z.string().optional().nullable(),
  source: z.nativeEnum(OpportunitySource).default(OpportunitySource.WEB),
  notes: z.string().optional().nullable(),
  lostReason: z.string().optional().nullable(),
})

export type OpportunitySchemaType = z.infer<typeof opportunitySchema>
