import { Router } from 'express';
import {
  getAllProjectRequirements,
  getProjectRequirementById,
  createProjectRequirement,
  updateProjectRequirement,
  deleteProjectRequirement,
  getProjectRequirementsByProjectId,
} from '../controllers/projectRequirement.controller';

const router = Router();

router.get('/', getAllProjectRequirements);
router.get('/:id', getProjectRequirementById);
router.post('/', createProjectRequirement);
router.put('/:id', updateProjectRequirement);
router.delete('/:id', deleteProjectRequirement);

// Get all requirements for a specific project
router.get('/project/:projectId', getProjectRequirementsByProjectId);

export default router;
