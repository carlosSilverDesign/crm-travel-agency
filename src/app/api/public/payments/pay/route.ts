import { NextRequest, NextResponse } from 'next/server'
import { updateProviderPaymentStatus } from '@/modules/bookings/mutations'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')

  if (!id) {
    return new NextResponse('Falta el ID de la liquidación', { status: 400 })
  }

  // Marcar como pagado
  const result = await updateProviderPaymentStatus(id, 'PAID', 'MOCK-BANK-TRANSFER')

  if (!result.success) {
    return new NextResponse(result.error || 'Error al procesar el pago del proveedor', { status: 500 })
  }

  // Redireccionar de vuelta al panel de operaciones
  const url = request.nextUrl.clone()
  url.pathname = '/dashboard/bookings'
  url.search = ''
  return NextResponse.redirect(url)
}
