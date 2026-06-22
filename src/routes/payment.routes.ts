import { Router } from 'express'
import { createCheckoutSession } from '../controllers/payment.controller'
import { requireAuth } from '../middleware/auth.middleware'

const router = Router()

router.post('/checkout', requireAuth, createCheckoutSession)

export default router
