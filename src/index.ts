import './config' // DOIT être le premier import — charge dotenv
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { PORT, NODE_ENV, FRONTEND_URL } from './config'
import authRoutes from './routes/auth.routes'
import { requireAuthForUploads } from './middleware/uploads.middleware'
import kycRoutes from './routes/kyc.routes'
import offeringRoutes from './routes/offering.routes'
import subscriptionRoutes from './routes/subscription.routes'
import userRoutes from './routes/user.routes'
import paymentRoutes from './routes/payment.routes'
import exportRoutes from './routes/export.routes'
import { handleStripeWebhook } from './controllers/webhook.controller'

const app = express()

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Accepte plusieurs origines : URL prod principale + URLs alternatives Vercel
const ALLOWED_ORIGINS = [
  FRONTEND_URL,                          // Variable d'env Render (URL principale)
  'https://investbf.vercel.app',         // URL courte Vercel
  'https://investbfplat.vercel.app',     // URL complète Vercel
  'http://localhost:3000',               // Développement local
].filter(Boolean)

app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }))
app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (ex: outils API, Postman)
    if (!origin) return callback(null, true)
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin non autorisé — ${origin}`))
  },
  credentials: true, // nécessaire pour les cookies HTTP-only (refresh token)
}))

// Logging HTTP — format compact en dev, standard Apache en production
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'))

// Webhook Stripe — DOIT être déclaré AVANT express.json() car Stripe a besoin du body brut
// pour vérifier la signature cryptographique de la requête
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook)

app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 200,
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' },
  standardHeaders: true, legacyHeaders: false,
})
app.use('/api/', globalLimiter)

app.use('/uploads', requireAuthForUploads, express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/kyc', kycRoutes)
app.use('/api/offerings', offeringRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/users', userRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/export', exportRoutes)

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
