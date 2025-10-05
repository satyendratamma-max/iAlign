import { Router } from 'express';
const router = Router();
router.get('/dashboard', (_req, res) => res.json({ success: true, data: {} }));
router.get('/segment-function', (_req, res) => res.json({ success: true, data: {} }));
export default router;
