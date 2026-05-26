import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getOfferings = async (req: Request, res: Response) => {
  try {
    const { sector, risk } = req.query
    const where: any = { isOpen: true }
    if (sector) where.sector = sector
    if (risk) where.riskLevel = risk

    const offerings = await prisma.offering.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { subs: true } } },
    })
    return res.json(offerings)
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const getOfferingById = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string
    const offering = await prisma.offering.findUnique({
      where: { id },
      include: { _count: { select: { subs: true } } },
    })
    if (!offering) return res.status(404).json({ error: 'Offre introuvable' })
    return res.json(offering)
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const createOffering = async (req: Request, res: Response) => {
  try {
    const { name, sector, pricePerShare, totalShares, minInvest, description, riskLevel } = req.body
    const offering = await prisma.offering.create({
      data: { name, sector, pricePerShare, totalShares, minInvest, description, riskLevel },
    })
    return res.status(201).json(offering)
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const updateOffering = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string
    const offering = await prisma.offering.update({
      where: { id },
      data: req.body,
    })
    return res.json(offering)
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
