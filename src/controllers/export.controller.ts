import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Échappe une valeur pour l'inclure dans un CSV RFC 4180 */
const csvEscape = (value: unknown): string => {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const toCSV = (rows: Record<string, unknown>[]): string => {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => csvEscape(row[h])).join(',')),
  ]
  return lines.join('\n')
}

const sendCSV = (res: Response, filename: string, data: string) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send('\uFEFF' + data) // BOM UTF-8 pour Excel
}

// ─── Export souscriptions ─────────────────────────────────────────────────────

export const exportSubscriptionsCSV = async (req: Request, res: Response) => {
  try {
    const subs = await prisma.subscription.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        offering: { select: { name: true, sector: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const rows = subs.map(s => ({
      id: s.id,
      date: s.createdAt.toISOString(),
      investisseur: `${s.user.firstName} ${s.user.lastName}`,
      email: s.user.email,
      offre: s.offering.name,
      secteur: s.offering.sector,
      actions: s.shares,
      montant_total_fcfa: s.totalAmount,
      stripe_session_id: s.stripeSessionId || '',
    }))

    const filename = `souscriptions_${new Date().toISOString().slice(0, 10)}.csv`
    sendCSV(res, filename, toCSV(rows))
  } catch {
    return res.status(500).json({ error: 'Erreur lors de la génération du CSV' })
  }
}

// ─── Export utilisateurs ──────────────────────────────────────────────────────

export const exportUsersCSV = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'INVESTOR' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        kycStatus: true,
        balance: true,
        createdAt: true,
        _count: { select: { subs: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const rows = users.map(u => ({
      id: u.id,
      date_inscription: u.createdAt.toISOString(),
      prenom: u.firstName,
      nom: u.lastName,
      email: u.email,
      statut_kyc: u.kycStatus,
      solde_fcfa: u.balance,
      nb_souscriptions: u._count.subs,
    }))

    const filename = `investisseurs_${new Date().toISOString().slice(0, 10)}.csv`
    sendCSV(res, filename, toCSV(rows))
  } catch {
    return res.status(500).json({ error: 'Erreur lors de la génération du CSV' })
  }
}
