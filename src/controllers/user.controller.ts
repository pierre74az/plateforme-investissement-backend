import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'INVESTOR' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        balance: true,
        createdAt: true,
        _count: { select: { subs: true } }
      },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(users)
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        balance: true,
        createdAt: true,
        kycDoc: true,
        subs: {
          include: { offering: { select: { name: true, sector: true } } },
          orderBy: { createdAt: 'desc' },
        }
      },
    })
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
    return res.json(user)
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string
    const { firstName, lastName, kycStatus, balance } = req.body
    const user = await prisma.user.update({
      where: { id },
      data: { firstName, lastName, kycStatus, balance },
    })
    return res.json(user)
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const getStats = async (req: Request, res: Response) => {
  try {
    const [users, kycs, subs, offerings] = await Promise.all([
      prisma.user.count({ where: { role: 'INVESTOR' } }),
      prisma.kycDocument.groupBy({ by: ['status'], _count: true }),
      prisma.subscription.aggregate({ _sum: { totalAmount: true }, _count: true }),
      prisma.offering.count({ where: { isOpen: true } }),
    ])

    const kycStats = kycs.reduce((acc: any, k) => {
      acc[k.status] = k._count
      return acc
    }, {})

    return res.json({
      totalInvestors: users,
      kycPending: kycStats['PENDING'] || 0,
      kycApproved: kycStats['APPROVED'] || 0,
      kycRejected: kycStats['REJECTED'] || 0,
      totalSubscriptions: subs._count,
      totalVolume: subs._sum.totalAmount || 0,
      activeOfferings: offerings,
    })
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { firstName, lastName } = req.body
    const user = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName },
      select: {
        id: true, email: true, firstName: true,
        lastName: true, role: true, kycStatus: true, balance: true,
      },
    })
    return res.json(user)
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
