import { Router } from 'express'
import { exportSubscriptionsCSV, exportUsersCSV } from '../controllers/export.controller'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'

const router = Router()

router.get('/subscriptions', requireAuth, requireAdmin, exportSubscriptionsCSV)
router.get('/users', requireAuth, requireAdmin, exportUsersCSV)

export default router
