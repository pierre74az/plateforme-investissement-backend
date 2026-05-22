import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth.routes'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

app.use('/api/auth', authRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/offerings', async (req, res) => {
  const offerings = await prisma.offering.findMany({
    where: { isOpen: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(offerings)
})

app.listen(PORT, () => {
  console.log(`✔ Serveur démarré sur http://localhost:${PORT}`)
})
