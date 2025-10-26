import { Router } from 'express';
import {
  getAllDomains,
  getDomainById,
  createDomain,
  updateDomain,
  deleteDomain,
  getDomainStats,
} from '../controllers/domain.controller';
import { shortCache, cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

router.get('/', getAllDomains);
router.get('/stats', cacheMiddleware(shortCache), getDomainStats); // Must be before /:id
router.get('/:id', getDomainById);
router.post('/', createDomain);
router.put('/:id', updateDomain);
router.delete('/:id', deleteDomain);

export default router;
