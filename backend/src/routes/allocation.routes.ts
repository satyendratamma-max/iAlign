import { Router } from 'express';
import {
  getAllAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  getResourceAllocations,
  getProjectAllocations,
  getDashboardMetrics,
} from '../controllers/allocation.controller';
import { shortCache, cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

// Cache key generator for allocations (includes query params for server-side filtering)
const allocationCacheKey = (req: any) => {
  const params = new URLSearchParams(req.query as any).toString();
  return `allocations:${params}`;
};

// Apply cache invalidation to all modification endpoints
router.use(invalidateCacheMiddleware(shortCache, 'allocations:'));

// GET endpoints with caching
router.get('/', cacheMiddleware(shortCache, allocationCacheKey), getAllAllocations);
router.get('/dashboard/metrics', cacheMiddleware(shortCache), getDashboardMetrics);
router.get('/:id', cacheMiddleware(shortCache), getAllocationById);

// Modification endpoints (no caching, but will invalidate cache)
router.post('/', createAllocation);
router.put('/:id', updateAllocation);
router.delete('/:id', deleteAllocation);

// Resource-specific allocations (with caching)
router.get('/resource/:resourceId', cacheMiddleware(shortCache), getResourceAllocations);

// Project-specific allocations (with caching)
router.get('/project/:projectId', cacheMiddleware(shortCache), getProjectAllocations);

export default router;
