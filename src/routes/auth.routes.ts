import { Router } from 'express'
import { register, login, getMe, refreshToken, logout } from '../controllers/auth.controller'
import { requireAuth } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { registerSchema, loginSchema } from '../lib/validators'
import { loginLimiter, registerLimiter } from '../middleware/security.middleware'

const router = Router()

router.post('/register', registerLimiter, validate(registerSchema), register)
router.post('/login', loginLimiter, validate(loginSchema), login)
router.post('/refresh', refreshToken)
router.post('/logout', logout)
router.get('/me', requireAuth, getMe)

export default router
