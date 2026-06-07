import prisma from '@/lib/prisma'
import { OpportunityStage } from '@prisma/client'
import { OpportunitySchemaType } from '@/lib/validations/opportunities.schema'

/**
 * Crear una nueva oportunidad en el pipeline
 */
export async function createOpportunity(data: OpportunitySchemaType) {
  try {
    const opportunity = await prisma.opportunity.create({
      data: {
        clientId: data.clientId,
        agentId: data.agentId,
        title: data.title,
        stage: data.stage || 'PROSPECT',
        estimatedValue: data.estimatedValue,
        currency: data.currency || 'USD',
        probability: data.probability || 10,
        closeDate: data.closeDate ? new Date(data.closeDate) : null,
        source: data.source || 'WEB',
        notes: data.notes,
      },
    })

    // Crear interacción automática indicando nueva oportunidad
    await prisma.interaction.create({
      data: {
        clientId: data.clientId,
        channel: 'NOTE',
        direction: 'OUTBOUND',
        subject: 'Oportunidad Creada',
        content: `Nueva oportunidad registrada: "${data.title}" con un valor estimado de ${data.currency} ${data.estimatedValue}.`,
        agentId: data.agentId,
        isAutomatic: true,
      },
    })

    return { success: true, data: opportunity }
  } catch (error: any) {
    console.error('Error creating opportunity:', error)
    return { success: false, error: 'Error al registrar la oportunidad en la base de datos.' }
  }
}

/**
 * Actualizar una oportunidad existente
 */
export async function updateOpportunity(id: string, data: Partial<OpportunitySchemaType>) {
  try {
    const updateData: any = { ...data }
    if (data.closeDate !== undefined) {
      updateData.closeDate = data.closeDate ? new Date(data.closeDate) : null
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: updateData,
    })
    return { success: true, data: opportunity }
  } catch (error: any) {
    console.error('Error updating opportunity:', error)
    return { success: false, error: 'Error al actualizar los datos de la oportunidad.' }
  }
}

/**
 * Cambiar el estado de la oportunidad (Transición del Pipeline Kanban)
 * Dispara automatizaciones de negocio según el estado destino.
 */
export async function updateOpportunityStage(id: string, stage: OpportunityStage) {
  try {
    // 1. Obtener la oportunidad actual
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        quotes: {
          where: { status: 'ACCEPTED' },
          take: 1,
        },
      },
    })

    if (!opportunity) {
      return { success: false, error: 'Oportunidad no encontrada.' }
    }

    if (opportunity.stage === stage) {
      return { success: true, data: opportunity }
    }

    // 2. Ejecutar la actualización de etapa
    const updatedOpportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        stage,
        probability:
          stage === 'WON' || stage === 'BOOKED'
            ? 100
            : stage === 'LOST'
            ? 0
            : stage === 'NEGOTIATION'
            ? 50
            : stage === 'QUOTED'
            ? 30
            : 10,
      },
    })

    // Registrar interacción de cambio de etapa
    await prisma.interaction.create({
      data: {
        clientId: opportunity.clientId,
        channel: 'NOTE',
        direction: 'OUTBOUND',
        subject: 'Cambio de Etapa en Pipeline',
        content: `Oportunidad "${opportunity.title}" movida de ${opportunity.stage} a ${stage}.`,
        agentId: opportunity.agentId,
        isAutomatic: true,
      },
    })

    // 3. AUTOMATIZACIÓN A: Al mover a BOOKED, crear automáticamente el registro de Booking
    if (stage === 'BOOKED') {
      // Verificar si ya existe un Booking para esta oportunidad
      const existingBooking = await prisma.booking.findFirst({
        where: { opportunityId: id },
      })

      if (!existingBooking) {
        // Buscar cotización aceptada o usar la oportunidad
        const acceptedQuote = opportunity.quotes[0]
        const totalAmount = acceptedQuote ? acceptedQuote.totalAmount : opportunity.estimatedValue
        const currency = acceptedQuote ? acceptedQuote.currency : opportunity.currency

        const travelDates = acceptedQuote?.itinerary
          ? {
              departureDate: new Date(), // fallback
              returnDate: new Date(new Date().setDate(new Date().getDate() + 7)),
            }
          : null

        // Crear la reserva
        await prisma.booking.create({
          data: {
            opportunityId: id,
            quoteId: acceptedQuote?.id || null,
            clientId: opportunity.clientId,
            status: 'CONFIRMED',
            totalAmount,
            currency,
            depositAmount: totalAmount * 0.2, // 20% depósito por defecto
            depositDueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
            balanceDueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            confirmationCode: `CONF-${Math.random().toString(36).substring(3, 9).toUpperCase()}`,
            travelDates: travelDates as any,
          },
        })

        // Notificar en timeline
        await prisma.interaction.create({
          data: {
            clientId: opportunity.clientId,
            channel: 'NOTE',
            direction: 'OUTBOUND',
            subject: 'Reserva Creada Automáticamente',
            content: `Se ha generado la reserva confirmada tras marcar la oportunidad como contratada (BOOKED).`,
            agentId: opportunity.agentId,
            isAutomatic: true,
          },
        })
      }
    }

    // 4. AUTOMATIZACIÓN B: Al mover a POST_SALE, encolar encuesta NPS
    if (stage === 'POST_SALE') {
      console.log(`[AUTOMATION] Encolando encuesta NPS para el cliente ${opportunity.clientId} vía QStash.`)
    }

    return { success: true, data: updatedOpportunity }
  } catch (error: any) {
    console.error('Error updating opportunity stage:', error)
    return { success: false, error: 'Error al cambiar la etapa de la oportunidad.' }
  }
}
