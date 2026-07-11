import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config'

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

export const generateAccessToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })

/**
 * Génère un refresh token opaque (random bytes) et retourne :
 * - `token`     : la valeur brute à envoyer au client dans un cookie HTTP-only
 * - `tokenHash` : le hash SHA-256 à stocker en base de données
 * - `expiresAt` : la date d'expiration
 */
export const generateRefreshToken = () => {
  const token = crypto.randomBytes(64).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
  return { token, tokenHash, expiresAt }
}

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex')

export const REFRESH_COOKIE_NAME = 'refreshToken'

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: REFRESH_TOKEN_EXPIRY_MS,
  path: '/api/auth',
}
