import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * Obtiene el usuario autenticado activo en el servidor.
 * Funciona de manera transparente tanto para la sesión real de Supabase como para el modo demo simulado.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const mockSession = cookieStore.get('mock-session')?.value === 'true'

  if (mockSession) {
    // Modo Demo: Devolvemos el primer usuario disponible en base de datos.
    const user = await prisma.user.findFirst()
    if (!user) {
      // Inicializar asesor demo por defecto si la base de datos está vacía
      const defaultUser = await prisma.user.create({
        data: {
          name: 'Asesor Demo',
          email: 'asesor@travel.com',
          role: 'ADMIN', // El demo inicia como ADMIN para poder visualizar todos los módulos
        },
      })
      return defaultUser
    }
    return user
  }

  // Modo Producción: Validamos sesión con Supabase Auth
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    // Buscar el perfil en la base de datos de Prisma
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    })

    if (!dbUser) {
      // Registrar perfil automáticamente en base de datos local si no existe
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Asesor Nuevo',
          email: user.email!,
          role: 'AGENT',
        },
      })
    }

    return dbUser
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}
