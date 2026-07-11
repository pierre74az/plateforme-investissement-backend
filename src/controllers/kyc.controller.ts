import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const submitKyc = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    if (!files?.idCard?.[0] || !files?.addressDoc?.[0])
      return res.status(400).json({ error: 'Les deux documents sont obligatoires' })

    const existing = await prisma.kycDocument.findUnique({ where: { userId } })
    if (existing) return res.status(400).json({ error: 'Vous avez déjà soumis un dossier KYC' })

    const kyc = await prisma.kycDocument.create({
      data: {
        userId,
        idCardUrl: `/uploads/${files.idCard[0].filename}`,
        addressUrl: `/uploads/${files.addressDoc[0].filename}`,
        status: 'PENDING',
      },
    })
    await prisma.user.update({ where: { id: userId }, data: { kycStatus: 'PENDING' } })
    return res.status(201).json(kyc)
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const getMyKyc = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const kyc = await prisma.kycDocument.findUnique({ where: { userId } })
    return res.json(kyc)
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const getAllKyc = async (req: Request, res: Response) => {
  try {
    const kycs = await prisma.kycDocument.findMany({
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(kycs)
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const reviewKyc = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string
    const { status } = req.body
    if (!['APPROVED', 'REJECTED'].includes(status))
      return res.status(400).json({ error: 'Statut invalide' })

    const kyc = await prisma.kycDocument.update({ where: { id }, data: { status } })
    await prisma.user.update({ where: { id: kyc.userId }, data: { kycStatus: status } })
    return res.json(kyc)
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
