import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getDashboardMetrics,
  bulkUpdateProjectRanks,
  bulkUpdateProjectSortOrders,
  getTopProjectsByBudget,
  getAtRiskProjects,
  getDomainPerformance,
} from '../controllers/project.controller';

const router = Router();

router.get('/', getAllProjects);
router.get('/stats', getProjectStats);
router.get('/dashboard/metrics', getDashboardMetrics);
router.get('/dashboard/top-by-budget', getTopProjectsByBudget);
router.get('/dashboard/at-risk', getAtRiskProjects);
router.get('/dashboard/domain-performance', getDomainPerformance);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/bulk-update-ranks', bulkUpdateProjectRanks);
router.put('/bulk-update-sort-orders', bulkUpdateProjectSortOrders);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
