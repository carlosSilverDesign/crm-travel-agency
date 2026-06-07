import prisma from '@/lib/prisma'
import { QuoteStatus } from '@prisma/client'
import { QuoteSchemaType } from '@/lib/validations/quotes.schema'
import { convertCurrency } from './currency'

/**
 * Crear una cotización con múltiples ítems e itinerario.
 * Realiza conversión multi-divisa automática para calcular el monto total.
 */
export async function createQuote(data: QuoteSchemaType) {
  try {
    // 1. Calcular el total convirtiendo cada ítem a la moneda base de la cotización
    let calculatedTotal = 0

    for (const item of data.items) {
      const convertedPrice = await convertCurrency(
        item.unitPrice * item.quantity,
        item.currency,
        data.currency
      )
      calculatedTotal += convertedPrice
    }

    // 2. Ejecutar la creación en una transacción de Prisma
    const quote = await prisma.$transaction(async (tx) => {
      const newQuote = await tx.quote.create({
        data: {
          opportunityId: data.opportunityId,
          clientId: data.clientId,
          agentId: data.agentId,
          status: data.status || 'DRAFT',
          validUntil: new Date(data.validUntil),
          totalAmount: calculatedTotal,
          currency: data.currency,
          itinerary: data.itinerary ? (data.itinerary as any) : [],
        },
      })

      // Crear todos los ítems asociados
      if (data.items.length > 0) {
        await tx.quoteItem.createMany({
          data: data.items.map((item) => ({
            quoteId: newQuote.id,
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
            providerId: item.providerId || null,
            providerRef: item.providerRef || null,
          })),
        })
      }

      return newQuote
    })

    // Registrar interacción de cotización creada
    await prisma.interaction.create({
      data: {
        clientId: data.clientId,
        channel: 'NOTE',
        direction: 'OUTBOUND',
        subject: 'Cotización Generada',
        content: `Nueva cotización de viaje creada: ID ${quote.id} por un monto de ${quote.currency} ${quote.totalAmount.toFixed(2)}.`,
        agentId: data.agentId,
        isAutomatic: true,
      },
    })

    return { success: true, data: quote }
  } catch (error: any) {
    console.error('Error creating quote:', error)
    return { success: false, error: 'Error al registrar la cotización en la base de datos.' }
  }
}

/**
 * Actualizar el estado de la cotización
 */
export async function updateQuoteStatus(id: string, status: QuoteStatus) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
    })

    if (!quote) {
      return { success: false, error: 'Cotización no encontrada.' }
    }

    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: {
        status,
        viewedAt: status === 'VIEWED' ? new Date() : undefined,
        sentAt: status === 'SENT' ? new Date() : undefined,
      },
    })

    // Registrar interacción en el timeline del pasajero
    await prisma.interaction.create({
      data: {
        clientId: quote.clientId,
        channel: 'NOTE',
        direction: 'OUTBOUND',
        subject: 'Estado de Cotización Actualizado',
        content: `Cotización ID ${id} actualizada a estado: ${status}.`,
        agentId: quote.agentId,
        isAutomatic: true,
      },
    })

    // Automatización de negocio: Si se acepta la cotización, mover oportunidad a BOOKED
    if (status === 'ACCEPTED') {
      await prisma.opportunity.update({
        where: { id: quote.opportunityId },
        data: {
          stage: 'BOOKED',
          probability: 100,
        },
      })
    }

    return { success: true, data: updatedQuote }
  } catch (error: any) {
    console.error('Error updating quote status:', error)
    return { success: false, error: 'Error al cambiar el estado de la cotización.' }
  }
}
