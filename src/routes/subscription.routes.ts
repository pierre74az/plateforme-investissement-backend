import { Router } from 'express'
import { subscribe, getMySubscriptions, getAllSubscriptions } from '../controllers/subscription.controller'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { createSubscriptionSchema } from '../lib/validators'

const router = Router()

router.post('/', requireAuth, validate(createSubscriptionSchema), subscribe)
router.get('/me', requireAuth, getMySubscriptions)
router.get('/all', requireAuth, requireAdmin, getAllSubscriptions)

export default router
