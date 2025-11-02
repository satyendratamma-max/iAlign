import express from 'express';
import {
  getProjectActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  togglePinActivity,
} from '../controllers/projectActivity.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Project activities routes
router.get('/projects/:projectId/activities', getProjectActivities);
router.post('/projects/:projectId/activities', createActivity);

// Activity-specific routes
router.put('/activities/:id', updateActivity);
router.delete('/activities/:id', deleteActivity);
router.put('/activities/:id/pin', togglePinActivity);

export default router;
