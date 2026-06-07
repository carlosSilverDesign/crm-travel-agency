import { NextRequest, NextResponse } from 'next/server'
import { updateQuoteStatus } from '@/modules/quotes/mutations'

/**
 * Registra cuando un cliente abre el enlace público de una cotización
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de cotización requerido' }, { status: 400 })
    }

    const result = await dbUpdateQuoteStatusViewed(id)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in public quote view webhook:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function dbUpdateQuoteStatusViewed(id: string) {
  const result = await updateQuoteStatus(id, 'VIEWED')
  if (result.success) {
    // Simular alerta en tiempo real con Supabase Realtime
    console.log(`[REALTIME NOTIFICATION] Alerta para el Asesor: El cliente ha leído la cotización ${id}`)
  }
  return result
}
