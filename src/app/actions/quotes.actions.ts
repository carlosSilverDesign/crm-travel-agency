'use server'

import prisma from '@/lib/prisma'
import { createQuote as dbCreateQuote, updateQuoteStatus as dbUpdateQuoteStatus } from '@/modules/quotes/mutations'
import { quoteSchema, QuoteSchemaType } from '@/lib/validations/quotes.schema'
import { QuoteStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

/**
 * Server Action para crear una cotización
 */
export async function createQuoteAction(data: QuoteSchemaType) {
  const parsed = quoteSchema.safeParse(data)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ')
    return { success: false, error: `Validación fallida: ${errorMsg}` }
  }

  const result = await dbCreateQuote(parsed.data)
  if (result.success) {
    revalidatePath('/dashboard/quotes')
    revalidatePath('/dashboard/opportunities')
    revalidatePath('/dashboard/clients')
  }
  return result
}

/**
 * Server Action para cambiar el estado de la cotización
 */
export async function updateQuoteStatusAction(id: string, status: QuoteStatus) {
  if (!id || !status) {
    return { success: false, error: 'ID y Estado requeridos.' }
  }

  const result = await dbUpdateQuoteStatus(id, status)
  if (result.success) {
    revalidatePath('/dashboard/quotes')
    revalidatePath('/dashboard/opportunities')
    revalidatePath('/dashboard/bookings')
  }
  return result
}

/**
 * Server Action para generar el PDF de la cotización
 * Simula la compilación y guardado en storage de Supabase
 */
export async function generateQuotePdfAction(quoteId: string) {
  if (!quoteId) {
    return { success: false, error: 'ID de cotización requerido.' }
  }

  try {
    // Simulamos la demora de generación de @react-pdf/renderer
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const pdfUrl = `/mock-quotes/cotizacion-${quoteId.substring(0, 8)}.pdf`

    // Actualizar el registro de la cotización con la URL del PDF
    await prisma?.quote.update({
      where: { id: quoteId },
      data: { pdfUrl },
    })

    return {
      success: true,
      data: {
        pdfUrl,
      },
    }
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return { success: false, error: 'Error al generar el documento PDF de la cotización.' }
  }
}
