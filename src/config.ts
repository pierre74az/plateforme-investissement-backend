import dotenv from 'dotenv'
dotenv.config()

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET manquant dans .env')
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env')

export const JWT_SECRET = process.env.JWT_SECRET as string
export const PORT = process.env.PORT || 3001
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
