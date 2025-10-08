import { Router } from 'express';
import {
  getAllScenarios,
  getScenarioById,
  createScenario,
  cloneScenario,
  updateScenario,
  publishScenario,
  deleteScenario,
  getScenarioStats,
} from '../controllers/scenario.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all scenarios (filtered by user role)
router.get('/', getAllScenarios);

// Get scenario by ID
router.get('/:id', getScenarioById);

// Get scenario statistics
router.get('/:id/stats', getScenarioStats);

// Create new scenario
router.post('/', createScenario);

// Clone scenario from existing
router.post('/:id/clone', cloneScenario);

// Update scenario (only planned scenarios can be updated)
router.put('/:id', updateScenario);

// Publish scenario (Admin and Domain Manager only)
router.put('/:id/publish', authorize('Administrator', 'Domain Manager'), publishScenario);

// Delete scenario (soft delete, only planned scenarios)
router.delete('/:id', deleteScenario);

export default router;
