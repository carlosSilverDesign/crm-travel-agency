import { z } from 'zod'
import { QuoteStatus, QuoteItemType } from '@prisma/client'

export const quoteItemSchema = z.object({
  type: z.nativeEnum(QuoteItemType),
  description: z.string().min(1, 'La descripción del ítem es requerida'),
  quantity: z.number().int().min(1, 'La cantidad debe ser mayor o igual a 1').default(1),
  unitPrice: z.number().min(0, 'El precio unitario debe ser mayor o igual a 0'),
  currency: z.string().default('USD'),
  providerId: z.string().optional().nullable(),
  providerRef: z.string().optional().nullable(),
})

export const itineraryDaySchema = z.object({
  day: z.number().int().min(1),
  title: z.string().min(1, 'El título del día es requerido'),
  description: z.string().min(1, 'La descripción del día es requerida'),
  activities: z.array(z.string()).default([]),
})

export const quoteSchema = z.object({
  opportunityId: z.string().min(1, 'La oportunidad es requerida'),
  clientId: z.string().min(1, 'El cliente es requerido'),
  agentId: z.string().min(1, 'El asesor es requerido'),
  status: z.nativeEnum(QuoteStatus).default(QuoteStatus.DRAFT),
  validUntil: z.string().min(1, 'La fecha de vencimiento es requerida'),
  totalAmount: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  itinerary: z.array(itineraryDaySchema).optional().default([]),
  items: z.array(quoteItemSchema).min(1, 'Debe incluir al menos un ítem en la cotización'),
})

export type QuoteSchemaType = z.infer<typeof quoteSchema>
export type QuoteItemSchemaType = z.infer<typeof quoteItemSchema>
export type ItineraryDaySchemaType = z.infer<typeof itineraryDaySchema>
