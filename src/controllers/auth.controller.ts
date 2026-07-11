import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
} from '../lib/tokens'

// ─── Register ────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {
  try {
    // La validation des champs est assurée par le middleware Zod en amont
    const { email, password, firstName, lastName } = req.body

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) return res.status(400).json({ error: 'Cet email est déjà utilisé' })

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    })

    const accessToken = generateAccessToken(user.id, user.role)
    const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken()

    await prisma.refreshToken.create({ data: { tokenHash, userId: user.id, expiresAt } })

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS)
    return res.status(201).json({
      accessToken,
      user: {
        id: user.id, email: user.email, firstName: user.firstName,
        lastName: user.lastName, role: user.role, kycStatus: user.kycStatus, balance: user.balance,
      },
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    const accessToken = generateAccessToken(user.id, user.role)
    const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken()

    await prisma.refreshToken.create({ data: { tokenHash, userId: user.id, expiresAt } })

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS)
    return res.json({
      accessToken,
      user: {
        id: user.id, email: user.email, firstName: user.firstName,
        lastName: user.lastName, role: user.role, kycStatus: user.kycStatus, balance: user.balance,
      },
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─── Refresh Token ───────────────────────────────────────────────────────────

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME]
    if (!rawToken) return res.status(401).json({ error: 'Refresh token manquant' })

    const tokenHash = hashToken(rawToken)
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!stored || stored.expiresAt < new Date()) {
      // Token invalide ou expiré — effacer le cookie
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' })
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' })
    }

    // Rotation du refresh token (token-rotation strategy)
    const { token: newRefreshToken, tokenHash: newTokenHash, expiresAt } = generateRefreshToken()

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { tokenHash } }),
      prisma.refreshToken.create({ data: { tokenHash: newTokenHash, userId: stored.userId, expiresAt } }),
    ])

    const newAccessToken = generateAccessToken(stored.user.id, stored.user.role)

    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS)
    return res.json({ accessToken: newAccessToken })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export const logout = async (req: Request, res: Response) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME]
    if (rawToken) {
      const tokenHash = hashToken(rawToken)
      // Supprimer silencieusement (token peut déjà être expiré)
      await prisma.refreshToken.deleteMany({ where: { tokenHash } })
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' })
    return res.json({ message: 'Déconnexion réussie' })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ─── GetMe ───────────────────────────────────────────────────────────────────

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, kycStatus: true, balance: true, createdAt: true,
      },
    })
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
    return res.json(user)
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
