import { Router } from 'express';
import { resetAllData, resetAndReseedData, resetAndReseedWithProgress } from '../controllers/admin.controller';
import { authenticate, authorize, authenticateSSE } from '../middleware/auth';

const router = Router();

// SSE endpoint for reset-and-reseed progress (uses query param auth)
router.get('/reset-and-reseed-progress', authenticateSSE, authorize('Administrator'), resetAndReseedWithProgress);

// All other routes require authentication and admin role
router.use(authenticate);
router.use(authorize('Administrator'));

router.post('/reset-data', resetAllData);
router.post('/reset-and-reseed', resetAndReseedData);

export default router;
