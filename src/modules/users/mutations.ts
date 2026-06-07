import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'

/**
 * Crear un nuevo perfil de usuario en base de datos
 */
export async function createUser(data: { id: string; name: string; email: string; role: Role }) {
  try {
    const user = await prisma.user.create({
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: true,
      },
    })
    return { success: true, data: user }
  } catch (error: any) {
    console.error('Error creating user profile:', error)
    return { success: false, error: 'Error al registrar el perfil del usuario.' }
  }
}

/**
 * Actualizar el rol de privilegios de un usuario
 */
export async function updateUserRole(id: string, role: Role) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    })
    return { success: true, data: user }
  } catch (error: any) {
    console.error('Error updating user role:', error)
    return { success: false, error: 'Error al actualizar el rol de usuario.' }
  }
}

/**
 * Activar o desactivar (soft-delete) la cuenta de un usuario
 */
export async function toggleUserStatus(id: string, isActive: boolean) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
    })
    return { success: true, data: user }
  } catch (error: any) {
    console.error('Error toggling user status:', error)
    return { success: false, error: 'Error al modificar el estado de la cuenta.' }
  }
}
