import { NextRequest, NextResponse } from 'next/server'
import { updateQuoteStatus } from '@/modules/quotes/mutations'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')

  if (!id) {
    return new NextResponse('Falta el ID de la cotización', { status: 400 })
  }

  const result = await updateQuoteStatus(id, 'ACCEPTED')

  if (!result.success) {
    return new NextResponse(result.error || 'Error al procesar la cotización', { status: 500 })
  }

  // Redireccionar de vuelta a la lista de cotizaciones
  const url = request.nextUrl.clone()
  url.pathname = '/dashboard/quotes'
  url.search = ''
  return NextResponse.redirect(url)
}
