import { Router } from 'express';
import {
  getAllMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getProjectMilestones,
} from '../controllers/milestone.controller';

const router = Router();

router.get('/', getAllMilestones);
router.get('/:id', getMilestoneById);
router.post('/', createMilestone);
router.put('/:id', updateMilestone);
router.delete('/:id', deleteMilestone);

// Project-specific milestones
router.get('/project/:projectId', getProjectMilestones);

export default router;
