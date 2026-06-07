import { z } from 'zod'
import { TravelerType } from '@prisma/client'

export const documentFileSchema = z.object({
  tipo: z.string().min(1, 'El tipo de documento es requerido'),
  url: z.string().url('URL de documento inválida'),
  expiryDate: z.string().optional().nullable(),
})

export const clientPreferencesSchema = z.object({
  seatType: z.string().optional().nullable(),
  mealType: z.string().optional().nullable(),
  hotelChains: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
})

export const clientSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Dirección de correo electrónico inválida'),
  phone: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  passportExpiry: z.string().optional().nullable(),
  documentFiles: z.array(documentFileSchema).default([]),
  preferences: clientPreferencesSchema.default({
    seatType: 'WINDOW',
    mealType: 'STANDARD',
    hotelChains: [],
    allergies: [],
  }),
  travelerType: z.nativeEnum(TravelerType).default(TravelerType.SOLO),
  loyaltyPoints: z.number().int().default(0),
  totalSpent: z.number().default(0.0),
  assignedAgentId: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
})

export type ClientSchemaType = z.infer<typeof clientSchema>
