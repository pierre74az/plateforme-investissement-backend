import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config'

// Accepte le token soit dans le header Authorization, soit en query param (?token=...)
// car les balises <img>/<a> du navigateur ne peuvent pas envoyer de header personnalisé.
export const requireAuthForUploads = (req: Request, res: Response, next: NextFunction) => {
  const headerToken = req.headers.authorization?.split(' ')[1]
  const queryToken = req.query.token as string | undefined
  const token = headerToken || queryToken

  if (!token) return res.status(401).json({ error: 'Accès non autorisé' })

  try {
    jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}
