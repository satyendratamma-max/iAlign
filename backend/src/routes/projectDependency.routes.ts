import { Router } from 'express';
import {
  getAllDependencies,
  getDependencyById,
  createDependency,
  updateDependency,
  deleteDependency,
} from '../controllers/projectDependency.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAllDependencies);
router.get('/:id', getDependencyById);
router.post('/', createDependency);
router.put('/:id', updateDependency);
router.delete('/:id', deleteDependency);

export default router;
