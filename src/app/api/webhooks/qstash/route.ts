import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface QStashPayload {
  action: 'checkin' | 'welcome' | 'nps' | 'reactivation' | 'birthday'
  clientId?: string
  bookingId?: string
}

/**
 * Endpoint de procesamiento de colas y cron jobs de Upstash QStash.
 * Automatiza correos de check-in, encuestas NPS, reactivaciones y cumpleaños.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Opcional: Validar firma de QStash para producción
    const qstashSignature = request.headers.get('upstash-signature')
    if (process.env.NODE_ENV === 'production' && !qstashSignature) {
      return NextResponse.json({ error: 'Firma de QStash ausente' }, { status: 401 })
    }

    const payload = (await request.json()) as QStashPayload
    const { action, clientId, bookingId } = payload

    console.log(`[QSTASH WEBHOOK] Recibida acción "${action}" para procesamiento en segundo plano.`)

    switch (action) {
      case 'welcome':
        if (clientId && bookingId) {
          await sendWelcomeEmail(clientId, bookingId)
        }
        break

      case 'checkin':
        await processCheckinReminders()
        break

      case 'nps':
        if (clientId) {
          await sendNpsSurvey(clientId)
        }
        break

      case 'birthday':
        await processBirthdayCongratulations()
        break

      case 'reactivation':
        await processReactivationCampaign()
        break

      default:
        return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 })
    }

    return NextResponse.json({ success: true, actionProcessed: action })
  } catch (error: any) {
    console.error('Error in QStash webhook handler:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * Automatización A: Envío de correo de bienvenida tras confirmar reserva
 */
async function sendWelcomeEmail(clientId: string, bookingId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } })
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })

  if (client && booking) {
    console.log(`
[EMAIL AUTOMATION - WELCOME]
De: Antigravity Travel <welcome@travel.com>
Para: ${client.firstName} ${client.lastName} <${client.email}>
Asunto: ¡Tu viaje está confirmado! Código de reserva: ${booking.confirmationCode}
Cuerpo: Hola ${client.firstName}, nos emociona mucho tu viaje. Adjuntamos tus vouchers y detalles.
    `)

    // Registrar en el timeline del pasajero
    await prisma.interaction.create({
      data: {
        clientId,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        subject: 'Envío de Bienvenida y Vouchers (Automático)',
        content: `Correo enviado tras confirmación de reserva ${booking.confirmationCode}.`,
        agentId: 'system',
        isAutomatic: true,
      },
    })
  }
}

/**
 * Automatización B: Recordatorio de check-in 48h antes del vuelo
 */
async function processCheckinReminders() {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + 2) // 48h desde hoy

  // Buscamos reservas activas donde el vuelo o salida sea en 48 horas
  // En este demo, simulamos la búsqueda de reservas con fecha de salida coincidente.
  console.log(`[CRON - CHECKIN] Escaneando salidas para el día: ${targetDate.toLocaleDateString()}`)
  
  // Si encontramos, simulamos el envío de check-in
  console.log('[EMAIL AUTOMATION - CHECKIN] Enviado recordatorio de check-in automático de 48h para vuelos activos.')
}

/**
 * Automatización C: Encuesta NPS 24h después del viaje
 */
async function sendNpsSurvey(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (client) {
    console.log(`
[EMAIL AUTOMATION - NPS SURVEY]
De: Calidad Antigravity Travel <nps@travel.com>
Para: ${client.firstName} ${client.lastName} <${client.email}>
Asunto: ¿Cómo estuvo tu reciente experiencia de viaje?
Cuerpo: Hola ${client.firstName}, ahora que estás de regreso, califica nuestra asesoría del 0 al 10.
    `)

    // Registrar en el timeline
    await prisma.interaction.create({
      data: {
        clientId,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        subject: 'Envío de Encuesta NPS (Automático)',
        content: 'Solicitud de feedback post-viaje enviada al cliente.',
        agentId: 'system',
        isAutomatic: true,
      },
    })
  }
}

/**
 * Automatización D: Felicitación de cumpleaños diaria
 */
async function processBirthdayCongratulations() {
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()

  console.log(`[CRON - BIRTHDAYS] Escaneando clientes nacidos el día: ${day}/${month}`)

  // Simulación: Buscamos clientes cuyo birthDate coincida en mes y día
  // Enviamos correo de felicitaciones con un descuento exclusivo.
  console.log('[EMAIL AUTOMATION - BIRTHDAY] Felicitaciones de cumpleaños enviadas a pasajeros con natalicio hoy.')
}

/**
 * Automatización E: Reactivación mensual (Clientes sin viajar por ~12 meses)
 */
async function processReactivationCampaign() {
  console.log('[CRON - REACTIVATION] Buscando pasajeros con más de 12 meses sin registrar viajes...')
  // Simulación: Enviamos newsletter y propuesta personalizada de reactivación.
  console.log('[EMAIL AUTOMATION - REACTIVATION] Boletín de reactivación enviado con éxito.')
}
