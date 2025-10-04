import { Router } from 'express';
import {
  getAllDomains,
  getDomainById,
  createDomain,
  updateDomain,
  deleteDomain,
} from '../controllers/domain.controller';

const router = Router();

router.get('/', getAllDomains);
router.get('/:id', getDomainById);
router.post('/', createDomain);
router.put('/:id', updateDomain);
router.delete('/:id', deleteDomain);

export default router;
