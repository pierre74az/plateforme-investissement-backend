import { Router } from 'express'
import { getOfferings, getOfferingById, createOffering, updateOffering, deleteOffering } from '../controllers/offering.controller'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'

const router = Router()

router.get('/', getOfferings)
router.get('/:id', getOfferingById)
router.post('/', requireAuth, requireAdmin, createOffering)
router.patch('/:id', requireAuth, requireAdmin, updateOffering)
router.delete('/:id', requireAuth, requireAdmin, deleteOffering)

export default router
