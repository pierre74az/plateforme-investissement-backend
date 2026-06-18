import { Router } from 'express'
import { register, login, getMe } from '../controllers/auth.controller'
import { requireAuth } from '../middleware/auth.middleware'
import { loginLimiter, registerLimiter } from '../middleware/security.middleware'

const router = Router()

router.post('/register', registerLimiter, register)
router.post('/login', loginLimiter, login)
router.get('/me', requireAuth, getMe)

export default router
