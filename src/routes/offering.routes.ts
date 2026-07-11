import { Router } from 'express'
import { getOfferings, getOfferingById, createOffering, updateOffering, deleteOffering } from '../controllers/offering.controller'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { createOfferingSchema, updateOfferingSchema } from '../lib/validators'

const router = Router()

router.get('/', getOfferings)
router.get('/:id', getOfferingById)
router.post('/', requireAuth, requireAdmin, validate(createOfferingSchema), createOffering)
router.patch('/:id', requireAuth, requireAdmin, validate(updateOfferingSchema), updateOffering)
router.delete('/:id', requireAuth, requireAdmin, deleteOffering)

export default router
