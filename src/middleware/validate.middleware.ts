import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

/**
 * Middleware générique de validation Zod.
 * Parse req.body avec le schéma fourni et renvoie 400 avec
 * le détail des erreurs si la validation échoue.
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return res.status(400).json({ error: 'Données invalides', details: errors })
    }
    req.body = result.data // données nettoyées et typées
    next()
  }
