import dotenv from 'dotenv'
dotenv.config()

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET manquant dans .env')
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env')
if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY manquant dans .env')

export const JWT_SECRET = process.env.JWT_SECRET as string
export const PORT = process.env.PORT || 3001
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

// Taux fixe officiel XOF/EUR (zone UEMOA — parité fixe garantie par la Banque de France)
// Stripe ne supporte pas XOF nativement, donc on convertit en EUR pour l'affichage
export const XOF_TO_EUR_RATE = 655.957
