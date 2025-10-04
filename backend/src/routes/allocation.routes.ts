import { Router } from 'express';
import {
  getAllAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  getResourceAllocations,
  getProjectAllocations,
} from '../controllers/allocation.controller';

const router = Router();

router.get('/', getAllAllocations);
router.get('/:id', getAllocationById);
router.post('/', createAllocation);
router.put('/:id', updateAllocation);
router.delete('/:id', deleteAllocation);

// Resource-specific allocations
router.get('/resource/:resourceId', getResourceAllocations);

// Project-specific allocations
router.get('/project/:projectId', getProjectAllocations);

export default router;
