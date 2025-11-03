import express from 'express';
import {
  getProjectActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  togglePinActivity,
  createTask,
  updateTaskStatus,
  assignTask,
  convertToTask,
} from '../controllers/projectActivity.controller';
import {
  getUserTasks,
  getUserMentions,
  getUserActivityFeed,
} from '../controllers/userDashboard.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Project activities routes
router.get('/projects/:projectId/activities', getProjectActivities);
router.post('/projects/:projectId/activities', createActivity);

// Task management routes
router.post('/projects/:projectId/tasks', createTask);

// Activity-specific routes
router.put('/activities/:id', updateActivity);
router.delete('/activities/:id', deleteActivity);
router.put('/activities/:id/pin', togglePinActivity);

// Task-specific routes
router.put('/activities/:id/status', updateTaskStatus);
router.put('/activities/:id/assign', assignTask);
router.put('/activities/:id/convert-to-task', convertToTask);

// User dashboard routes
router.get('/users/:userId/tasks', getUserTasks);
router.get('/users/:userId/mentions', getUserMentions);
router.get('/users/:userId/activity-feed', getUserActivityFeed);

export default router;
