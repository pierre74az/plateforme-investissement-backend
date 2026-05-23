import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { submitKyc, getMyKyc, getAllKyc, reviewKyc } from '../controllers/kyc.controller'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/
    const ext = allowed.test(path.extname(file.originalname).toLowerCase())
    ext ? cb(null, true) : cb(new Error('Format non supporté'))
  },
})

const router = Router()

router.post('/', requireAuth, upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'addressDoc', maxCount: 1 },
]), submitKyc)

router.get('/me', requireAuth, getMyKyc)
router.get('/all', requireAuth, requireAdmin, getAllKyc)
router.patch('/:id/review', requireAuth, requireAdmin, reviewKyc)

export default router
