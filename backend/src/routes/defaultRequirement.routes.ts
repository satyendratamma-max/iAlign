import { Router } from 'express';
import {
  getAllDefaultRequirements,
  getDefaultRequirementById,
  createDefaultRequirement,
  updateDefaultRequirement,
  deleteDefaultRequirement,
  reorderDefaultRequirements,
} from '../controllers/defaultRequirement.controller';

const router = Router();

router.get('/', getAllDefaultRequirements);
router.get('/:id', getDefaultRequirementById);
router.post('/', createDefaultRequirement);
router.put('/:id', updateDefaultRequirement);
router.delete('/:id', deleteDefaultRequirement);

// Reorder default requirements
router.post('/reorder', reorderDefaultRequirements);

export default router;
