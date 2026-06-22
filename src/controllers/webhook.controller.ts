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
    console.error('Webhook signature invalide:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, offeringId, shares, totalAmount } = session.metadata as any

    try {
      const sharesNum = parseInt(shares)
      const totalAmountNum = parseFloat(totalAmount)

      const offering = await prisma.offering.findUnique({ where: { id: offeringId } })
      if (!offering) {
        console.error('Offre introuvable pour le webhook:', offeringId)
        return res.status(200).json({ received: true })
      }

      const remaining = offering.totalShares - offering.soldShares
      if (sharesNum > remaining) {
        console.error('Plus assez d\'actions disponibles au moment du webhook')
        return res.status(200).json({ received: true })
      }

      // Transaction atomique — identique à la souscription directe
      await prisma.$transaction([
        prisma.subscription.create({
          data: { userId, offeringId, shares: sharesNum, totalAmount: totalAmountNum },
        }),
        prisma.offering.update({
          where: { id: offeringId },
          data: { soldShares: { increment: sharesNum } },
        }),
      ])

      console.log(`✔ Souscription créée via Stripe pour user ${userId}`)
    } catch (error) {
      console.error('Erreur lors de la création de la souscription post-paiement:', error)
    }
  }

  return res.status(200).json({ received: true })
}
