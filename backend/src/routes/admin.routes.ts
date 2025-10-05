import { Router } from 'express';
import { resetAllData, resetAndReseedData } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('Administrator'));

router.post('/reset-data', resetAllData);
router.post('/reset-and-reseed', resetAndReseedData);

export default router;
