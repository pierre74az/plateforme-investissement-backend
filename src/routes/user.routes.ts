import { Router } from 'express'
import { getAllUsers, getUserById, updateUser, getStats, updateMyProfile } from '../controllers/user.controller'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'

const router = Router()

router.get('/stats', requireAuth, requireAdmin, getStats)
router.get('/', requireAuth, requireAdmin, getAllUsers)
router.get('/:id', requireAuth, requireAdmin, getUserById)
router.patch('/:id', requireAuth, requireAdmin, updateUser)
router.patch('/me/profile', requireAuth, updateMyProfile)

export default router
