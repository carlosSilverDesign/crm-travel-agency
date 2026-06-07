'use server'

import { cookies } from 'next/headers'

/**
 * Server Action para iniciar sesión en modo demo
 */
export async function loginDemoAction() {
  const cookieStore = await cookies()
  cookieStore.set('mock-session', 'true', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    httpOnly: false, // Permitimos acceso en cliente para simplificar
  })
  return { success: true }
}

/**
 * Server Action para cerrar sesión
 */
export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('mock-session')
  return { success: true }
}
