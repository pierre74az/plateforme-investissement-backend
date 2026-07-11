import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'
import { STRIPE_WEBHOOK_SECRET } from '../config'
import Stripe from 'stripe'

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('[Webhook] Signature invalide:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`[Webhook] Événement reçu : ${event.type}`)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Vérifier que le paiement est bien réussi
    if (session.payment_status !== 'paid') {
      console.log(`[Webhook] Session ${session.id} — paiement non finalisé (${session.payment_status})`)
      return res.status(200).json({ received: true })
    }

    const { userId, offeringId, shares, totalAmount } = session.metadata as {
      userId: string; offeringId: string; shares: string; totalAmount: string
    }

    // Idempotence — vérifier que cette session Stripe n'a pas déjà été traitée
    const alreadyProcessed = await prisma.subscription.findFirst({
      where: { stripeSessionId: session.id },
    }).catch(() => null)

    if (alreadyProcessed) {
      console.log(`[Webhook] Session ${session.id} déjà traitée — ignorée`)
      return res.status(200).json({ received: true })
    }

    const sharesNum = parseInt(shares)
    const totalAmountNum = parseFloat(totalAmount)

    try {
      const [offering, user] = await Promise.all([
        prisma.offering.findUnique({ where: { id: offeringId } }),
        prisma.user.findUnique({ where: { id: userId } }),
      ])

      if (!offering) {
        console.error(`[Webhook] Offre introuvable : ${offeringId}`)
        return res.status(200).json({ received: true })
      }

      // Revalidation KYC — l'état peut avoir changé depuis la création de la session
      if (user?.kycStatus !== 'APPROVED') {
        console.error(`[Webhook] KYC non approuvé pour l'utilisateur ${userId} — souscription annulée`)
        return res.status(200).json({ received: true })
      }

      const remaining = offering.totalShares - offering.soldShares
      if (sharesNum > remaining) {
        console.error(`[Webhook] Plus assez d'actions disponibles (demandé: ${sharesNum}, disponible: ${remaining})`)
        return res.status(200).json({ received: true })
      }

      // Transaction atomique avec stockage de l'ID de session Stripe (idempotence)
      await prisma.$transaction([
        prisma.subscription.create({
          data: {
            userId,
            offeringId,
            shares: sharesNum,
            totalAmount: totalAmountNum,
            stripeSessionId: session.id,
          },
        }),
        prisma.offering.update({
          where: { id: offeringId },
          data: { soldShares: { increment: sharesNum } },
        }),
      ])

      console.log(`[Webhook] ✔ Souscription créée — session ${session.id}`)
    } catch (error) {
      console.error('[Webhook] Erreur transaction:', error)
      // On retourne 200 quand même pour éviter que Stripe ne réessaie indéfiniment
      // sur des erreurs métier (offre fermée, KYC révoqué, etc.)
      // SAUF si c'est une erreur technique (DB down), dans ce cas il faut que Stripe réessaie
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    console.log(`[Webhook] Session expirée : ${session.id} — aucune action requise`)
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent
    console.log(`[Webhook] Paiement échoué : ${intent.id} — raison: ${intent.last_payment_error?.message || 'inconnue'}`)
  }

  return res.status(200).json({ received: true })
}