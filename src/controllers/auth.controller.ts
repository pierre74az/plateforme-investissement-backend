import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { isEmail } from 'validator'
import { prisma } from '../lib/prisma'
import { JWT_SECRET } from '../config'

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body
    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ error: 'Tous les champs sont obligatoires' })
    if (!isEmail(email))
      return res.status(400).json({ error: "Format d'email invalide" })
    if (password.length < 8)
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' })
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return res.status(400).json({ error: 'Le mot de passe doit contenir majuscule, minuscule et chiffre' })
    if (firstName.trim().length < 2 || lastName.trim().length < 2)
      return res.status(400).json({ error: 'Prénom et nom doivent contenir au moins 2 caractères' })

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) return res.status(400).json({ error: 'Cet email est déjà utilisé' })

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashedPassword, firstName: firstName.trim(), lastName: lastName.trim() },
    })

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, kycStatus: user.kycStatus, balance: user.balance },
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })
    if (!isEmail(email)) return res.status(400).json({ error: "Format d'email invalide" })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, kycStatus: user.kycStatus, balance: user.balance },
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, kycStatus: true, balance: true, createdAt: true },
    })
    return res.json(user)
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
