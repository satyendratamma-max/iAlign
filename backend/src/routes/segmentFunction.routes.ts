import { Router } from 'express';
import {
  getAllSegmentFunctions,
  getSegmentFunctionById,
  createSegmentFunction,
  updateSegmentFunction,
  deleteSegmentFunction,
  getSegmentFunctionStats,
  getSegmentFunctionRisk,
  getBatchSegmentFunctionRisk,
} from '../controllers/segmentFunction.controller';
import { mediumCache, cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

// Apply cache invalidation to modification endpoints
router.use(invalidateCacheMiddleware(mediumCache, 'segment-functions'));

router.get('/', getAllSegmentFunctions);
router.get('/stats', getSegmentFunctionStats);
// Batch risk calculation with 15-minute cache (expensive operation)
router.get('/batch-risk', cacheMiddleware(mediumCache), getBatchSegmentFunctionRisk);
// Single risk calculation with 15-minute cache (expensive operation)
router.get('/:id/risk', cacheMiddleware(mediumCache), getSegmentFunctionRisk);
router.get('/:id', getSegmentFunctionById);
router.post('/', createSegmentFunction);
router.put('/:id', updateSegmentFunction);
router.delete('/:id', deleteSegmentFunction);

export default router;
