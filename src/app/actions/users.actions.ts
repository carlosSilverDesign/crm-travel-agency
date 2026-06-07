'use server'

import { userCreateSchema, UserCreateSchemaType } from '@/lib/validations/users.schema'
import { createUser as dbCreateUser, updateUserRole as dbUpdateUserRole, toggleUserStatus as dbToggleUserStatus } from '@/modules/users/mutations'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { Role } from '@prisma/client'

/**
 * Server Action para crear un usuario (Supabase Auth + Prisma User)
 */
export async function createUserAction(data: UserCreateSchemaType) {
  const parsed = userCreateSchema.safeParse(data)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ')
    return { success: false, error: `Validación fallida: ${errorMsg}` }
  }

  const { name, email, role, password } = parsed.data

  try {
    let authId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)

    // Intentamos usar la API administrativa de Supabase Auth si contamos con el Service Role Key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey && supabaseServiceKey !== 'placeholder') {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })

        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: password || 'TempPass123*',
          email_confirm: true,
          user_metadata: { name },
        })

        if (authError) {
          console.error('Supabase Auth Admin API error:', authError.message)
          return { success: false, error: `Error de Autenticación: ${authError.message}` }
        }

        if (authUser?.user) {
          authId = authUser.user.id
        }
      } catch (err) {
        console.error('Failed to communicate with Supabase Admin API:', err)
        // Fail-open para desarrollo local con mock data
      }
    }

    const result = await dbCreateUser({
      id: authId,
      name,
      email,
      role: role as Role,
    })

    if (result.success) {
      revalidatePath('/dashboard/users')
    }
    return result
  } catch (error: any) {
    console.error('Error in createUserAction:', error)
    return { success: false, error: 'Ocurrió un error inesperado al registrar el usuario.' }
  }
}

/**
 * Server Action para actualizar el rol de un usuario
 */
export async function updateUserRoleAction(id: string, role: Role) {
  if (!id || !role) {
    return { success: false, error: 'ID y Rol requeridos.' }
  }

  const result = await dbUpdateUserRole(id, role)
  if (result.success) {
    revalidatePath('/dashboard/users')
  }
  return result
}

/**
 * Server Action para activar/desactivar un usuario (Soft-delete)
 */
export async function toggleUserStatusAction(id: string, isActive: boolean) {
  if (!id) {
    return { success: false, error: 'ID de usuario requerido.' }
  }

  const result = await dbToggleUserStatus(id, isActive)
  if (result.success) {
    revalidatePath('/dashboard/users')
  }
  return result
}
