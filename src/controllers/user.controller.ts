import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit
    const search = req.query.search as string

    const where: any = { role: 'INVESTOR' }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, kycStatus: true, balance: true, createdAt: true,
          _count: { select: { subs: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])
    return res.json({ data: users, total, page, pages: Math.ceil(total / limit) })
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
        id: true, email: true, firstName: true, lastName: true, role: true,
        kycStatus: true, balance: true, createdAt: true, kycDoc: true,
        subs: {
          include: { offering: { select: { name: true, sector: true } } },
          orderBy: { createdAt: 'desc' },
        },
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
    // La validation (champs autorisés + types) est assurée par le middleware Zod en amont
    const id = req.params['id'] as string
    const { firstName, lastName, kycStatus, balance } = req.body

    const data: Record<string, any> = {}
    if (firstName !== undefined) data.firstName = firstName
    if (lastName !== undefined) data.lastName = lastName
    if (kycStatus !== undefined) data.kycStatus = kycStatus
    if (balance !== undefined) data.balance = balance

    if (Object.keys(data).length === 0)
      return res.status(400).json({ error: 'Aucun champ valide à mettre à jour' })

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, kycStatus: true, balance: true,
      },
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
    const kycStats = kycs.reduce((acc: any, k) => { acc[k.status] = k._count; return acc }, {})
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
    const userId = req.userId!
    const { firstName, lastName } = req.body

    const data: Record<string, any> = {}
    if (firstName !== undefined) data.firstName = firstName
    if (lastName !== undefined) data.lastName = lastName

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, kycStatus: true, balance: true,
      },
    })
    return res.json(user)
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
