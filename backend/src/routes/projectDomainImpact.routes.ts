import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAllProjectDomainImpacts,
  getProjectDomainImpactById,
  createProjectDomainImpact,
  updateProjectDomainImpact,
  deleteProjectDomainImpact,
  bulkUpsertDomainImpacts,
} from '../controllers/projectDomainImpact.controller';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllProjectDomainImpacts);
router.get('/:id', getProjectDomainImpactById);
router.post('/', createProjectDomainImpact);
router.post('/bulk-upsert', bulkUpsertDomainImpacts);
router.put('/:id', updateProjectDomainImpact);
router.delete('/:id', deleteProjectDomainImpact);

export default router;
