import { Router } from 'express';
const router = Router();
router.get('/dashboard', (_req, res) => res.json({ success: true, data: {} }));
router.get('/portfolio', (_req, res) => res.json({ success: true, data: {} }));
export default router;
