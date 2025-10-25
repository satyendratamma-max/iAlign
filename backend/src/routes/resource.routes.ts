import { Router } from 'express';
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getDashboardMetrics,
} from '../controllers/resource.controller';

const router = Router();

router.get('/', getAllResources);
router.get('/dashboard/metrics', getDashboardMetrics);
router.get('/:id', getResourceById);
router.post('/', createResource);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);

export default router;
