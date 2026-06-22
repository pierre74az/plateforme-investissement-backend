import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'
import { FRONTEND_URL } from '../config'

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { offeringId, shares } = req.body

    if (!offeringId || !shares || shares < 1)
      return res.status(400).json({ error: 'Données invalides' })

    const offering = await prisma.offering.findUnique({ where: { id: offeringId } })
    if (!offering || !offering.isOpen)
      return res.status(400).json({ error: 'Offre indisponible' })

    const remaining = offering.totalShares - offering.soldShares
    if (shares > remaining)
      return res.status(400).json({ error: `Seulement ${remaining} actions disponibles` })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
    if (user.kycStatus !== 'APPROVED')
      return res.status(403).json({ error: 'Votre KYC doit être validé avant de souscrire' })

    const totalAmount = shares * offering.pricePerShare

    // Stripe utilise les centimes — on convertit FCFA -> centimes EUR pour la démo (XOF non supporté par Stripe)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${shares} action(s) — ${offering.name}`,
            description: offering.description.slice(0, 200),
          },
          unit_amount: Math.round((totalAmount / 655.957) * 100), // conversion FCFA -> EUR centimes (taux fixe XOF/EUR)
        },
        quantity: 1,
      }],
      metadata: { userId, offeringId, shares: String(shares), totalAmount: String(totalAmount) },
      success_url: `${FRONTEND_URL}/souscrire/${offeringId}/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/souscrire/${offeringId}`,
    })

    return res.json({ url: session.url, sessionId: session.id })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur lors de la création du paiement' })
  }
}
