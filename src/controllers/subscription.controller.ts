import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const subscribe = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { offeringId, shares } = req.body

    if (!offeringId || !shares || shares < 1)
      return res.status(400).json({ error: 'Données invalides' })

    const offering = await prisma.offering.findUnique({ where: { id: offeringId } })
    if (!offering || !offering.isOpen)
      return res.status(400).json({ error: 'Offre indisponible' })

    const remaining = offering.totalShares - offering.soldShares
    if (shares > remaining)
      return res.status(400).json({ error: `Seulement ${remaining} actions disponibles` })

    const totalAmount = shares * offering.pricePerShare
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
    if (user.kycStatus !== 'APPROVED')
      return res.status(403).json({ error: 'Votre KYC doit être validé avant de souscrire' })
    if (user.balance < totalAmount)
      return res.status(400).json({ error: 'Solde insuffisant' })

    // Transaction atomique — 3 opérations
    const [subscription, updatedUser] = await prisma.$transaction([
      prisma.subscription.create({ data: { userId, offeringId, shares, totalAmount } }),
      prisma.user.update({ where: { id: userId }, data: { balance: { decrement: totalAmount } } }),
      prisma.offering.update({ where: { id: offeringId }, data: { soldShares: { increment: shares } } }),
    ])

    return res.status(201).json({
      subscription,
      newBalance: updatedUser.balance,
      message: `Souscription réussie — ${shares} actions de ${offering.name}`,
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const getMySubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const [subs, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where: { userId },
        include: { offering: { select: { id: true, name: true, sector: true, pricePerShare: true, riskLevel: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.subscription.count({ where: { userId } }),
    ])
    return res.json({ data: subs, total, page, pages: Math.ceil(total / limit) })
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const getAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const [subs, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          offering: { select: { name: true, sector: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.subscription.count(),
    ])
    return res.json({ data: subs, total, page, pages: Math.ceil(total / limit) })
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
