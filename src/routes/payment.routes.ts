import { Router } from 'express'
import { createCheckoutSession, checkPaymentStatus } from '../controllers/payment.controller'
import { requireAuth } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { createSubscriptionSchema } from '../lib/validators'

const router = Router()

router.post('/checkout', requireAuth, validate(createSubscriptionSchema), createCheckoutSession)
router.get('/session/:sessionId', requireAuth, checkPaymentStatus)

export default router
