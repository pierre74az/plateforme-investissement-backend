import { Router } from 'express'
import { createCheckoutSession, checkPaymentStatus } from '../controllers/payment.controller'
import { requireAuth } from '../middleware/auth.middleware'

const router = Router()

router.post('/checkout', requireAuth, createCheckoutSession)
router.get('/session/:sessionId', requireAuth, checkPaymentStatus)

export default router
