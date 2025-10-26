import { Router } from 'express';
import {
  getAllModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  getAllScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  deleteScenario,
  compareModels,
  getDashboardMetrics,
  getDashboardResources,
} from '../controllers/capacity.controller';
import { shortCache, cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

// Dashboard endpoints (with caching)
router.get('/dashboard/metrics', cacheMiddleware(shortCache), getDashboardMetrics);
router.get('/dashboard/resources', cacheMiddleware(shortCache), getDashboardResources);

// Capacity Model CRUD
router.get('/models', getAllModels);
router.get('/models/compare', compareModels);
router.get('/models/:id', getModelById);
router.post('/models', createModel);
router.put('/models/:id', updateModel);
router.delete('/models/:id', deleteModel);

// Capacity Scenario CRUD
router.get('/scenarios', getAllScenarios);
router.get('/scenarios/:id', getScenarioById);
router.post('/scenarios', createScenario);
router.put('/scenarios/:id', updateScenario);
router.delete('/scenarios/:id', deleteScenario);

export default router;
