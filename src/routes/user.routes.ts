import { Router } from 'express'
import { getAllUsers, getUserById, updateUser, getStats, updateMyProfile } from '../controllers/user.controller'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { updateUserAdminSchema, updateMyProfileSchema } from '../lib/validators'

const router = Router()

router.get('/stats', requireAuth, requireAdmin, getStats)
router.get('/', requireAuth, requireAdmin, getAllUsers)
router.patch('/me/profile', requireAuth, validate(updateMyProfileSchema), updateMyProfile)
router.get('/:id', requireAuth, requireAdmin, getUserById)
router.patch('/:id', requireAuth, requireAdmin, validate(updateUserAdminSchema), updateUser)

export default router
