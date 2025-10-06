import { Router } from 'express';
import {
  getAllResourceCapabilities,
  getResourceCapabilityById,
  createResourceCapability,
  updateResourceCapability,
  deleteResourceCapability,
} from '../controllers/resourceCapability.controller';

const router = Router();

router.get('/', getAllResourceCapabilities);
router.get('/:id', getResourceCapabilityById);
router.post('/', createResourceCapability);
router.put('/:id', updateResourceCapability);
router.delete('/:id', deleteResourceCapability);

export default router;
