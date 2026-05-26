import { Router } from 'express'
import { subscribe, getMySubscriptions, getAllSubscriptions } from '../controllers/subscription.controller'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'

const router = Router()

router.post('/', requireAuth, subscribe)
router.get('/me', requireAuth, getMySubscriptions)
router.get('/all', requireAuth, requireAdmin, getAllSubscriptions)

export default router
