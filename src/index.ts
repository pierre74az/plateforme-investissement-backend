import './config' // DOIT être le premier import — charge dotenv
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { PORT, NODE_ENV, FRONTEND_URL } from './config'
import authRoutes from './routes/auth.routes'
import { requireAuthForUploads } from './middleware/uploads.middleware'
import kycRoutes from './routes/kyc.routes'
import offeringRoutes from './routes/offering.routes'
import subscriptionRoutes from './routes/subscription.routes'
import userRoutes from './routes/user.routes'

const app = express()

app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }))
app.use(cors({ origin: FRONTEND_URL }))
app.use(express.json({ limit: '10mb' }))

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 200,
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' },
  standardHeaders: true, legacyHeaders: false,
})
app.use('/api/', globalLimiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true, legacyHeaders: false,
})

app.use('/uploads', requireAuthForUploads, express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/kyc', kycRoutes)
app.use('/api/offerings', offeringRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/users', userRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: NODE_ENV })
})

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable` })
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`)
  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Erreur serveur interne' : err.message
  })
})

app.listen(PORT, () => {
  console.log(`✔ Serveur démarré sur http://localhost:${PORT}`)
  console.log(`✔ Environnement : ${NODE_ENV}`)
})
