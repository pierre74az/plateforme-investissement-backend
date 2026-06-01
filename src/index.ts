import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth.routes'
import kycRoutes from './routes/kyc.routes'
import offeringRoutes from './routes/offering.routes'
import subscriptionRoutes from './routes/subscription.routes'
import userRoutes from './routes/user.routes'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/kyc', kycRoutes)
app.use('/api/offerings', offeringRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/users', userRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`✔ Serveur démarré sur http://localhost:${PORT}`)
})
