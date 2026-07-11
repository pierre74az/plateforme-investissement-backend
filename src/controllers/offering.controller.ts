import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getOfferings = async (req: Request, res: Response) => {
  try {
    const { sector, risk, includeClosed } = req.query
    const where: any = includeClosed === 'true' ? {} : { isOpen: true }
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
    // La validation est assurée par le middleware Zod en amont
    const { name, sector, pricePerShare, totalShares, minInvest, description, riskLevel } = req.body
    const offering = await prisma.offering.create({
      data: { name, sector, pricePerShare, totalShares, minInvest, description, riskLevel },
    })
    return res.status(201).json(offering)
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Liste blanche des champs modifiables — empêche le mass assignment
// (ex: soldShares ou createdAt ne peuvent pas être manipulés via cette route)
const UPDATABLE_FIELDS = [
  'name', 'sector', 'pricePerShare', 'totalShares',
  'minInvest', 'description', 'riskLevel', 'isOpen',
] as const

export const updateOffering = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string
    const data: Record<string, any> = {}

    // Appliquer la liste blanche même si Zod a déjà validé les champs
    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) data[field] = req.body[field]
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Aucun champ valide à mettre à jour' })
    }

    const offering = await prisma.offering.update({ where: { id }, data })
    return res.json(offering)
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const deleteOffering = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string
    await prisma.offering.delete({ where: { id } })
    return res.json({ message: 'Offre supprimée' })
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
