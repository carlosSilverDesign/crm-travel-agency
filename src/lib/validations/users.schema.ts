import { z } from 'zod'
import { Role } from '@prisma/client'

export const userCreateSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre es demasiado largo'),
  email: z.string().email('Debe ingresar un correo electrónico válido'),
  role: z.nativeEnum(Role).default(Role.AGENT),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().nullable(),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre es demasiado largo').optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
})

export type UserCreateSchemaType = z.infer<typeof userCreateSchema>
export type UserUpdateSchemaType = z.infer<typeof userUpdateSchema>
