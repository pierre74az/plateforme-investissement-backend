import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'
import { FRONTEND_URL, XOF_TO_EUR_RATE } from '../config'

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { offeringId, shares } = req.body

    if (!offeringId || !shares || shares < 1)
      return res.status(400).json({ error: 'Données invalides' })

    const [offering, user] = await Promise.all([
      prisma.offering.findUnique({ where: { id: offeringId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ])

    if (!offering || !offering.isOpen)
      return res.status(400).json({ error: 'Offre indisponible' })

    const remaining = offering.totalShares - offering.soldShares
    if (shares > remaining)
      return res.status(400).json({ error: `Seulement ${remaining} actions disponibles` })

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    if (user.kycStatus !== 'APPROVED')
      return res.status(403).json({ error: 'Votre KYC doit être validé avant de souscrire' })

    const totalAmount = shares * offering.pricePerShare
    // Conversion XOF → EUR (taux fixe UEMOA) car Stripe ne supporte pas XOF nativement
    const amountInEurCents = Math.round((totalAmount / XOF_TO_EUR_RATE) * 100)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${shares} action(s) — ${offering.name}`,
            description: `${offering.sector} · Risque ${offering.riskLevel} · ${totalAmount.toLocaleString('fr-FR')} FCFA`,
          },
          unit_amount: amountInEurCents,
        },
        quantity: 1,
      }],
      metadata: {
        userId,
        offeringId,
        shares: String(shares),
        totalAmount: String(totalAmount),
      },
      success_url: `${FRONTEND_URL}/souscrire/${offeringId}/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/souscrire/${offeringId}`,
    })

    return res.json({ url: session.url, sessionId: session.id })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur lors de la création du paiement' })
  }
}

// Route pour vérifier si la souscription a bien été créée après paiement (polling frontend)
export const checkPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const sessionId = req.params["sessionId"] as string

    // Vérifier côté Stripe que la session est bien payée
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') {
      return res.json({ paid: false, subscriptionCreated: false })
    }

    // Vérifier que la souscription a été créée en base par le webhook
    const offeringId = session.metadata?.offeringId
    const subscription = await prisma.subscription.findFirst({
      where: { userId, offeringId: offeringId || '' },
      orderBy: { createdAt: 'desc' },
    })

    return res.json({
      paid: true,
      subscriptionCreated: !!subscription,
      subscription: subscription || null,
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur lors de la vérification' })
  }
}
