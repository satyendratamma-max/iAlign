import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => res.json({ success: true, data: [] }));
router.post('/', (_req, res) => res.status(201).json({ success: true, message: 'Created' }));
export default router;
