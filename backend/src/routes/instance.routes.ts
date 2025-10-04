import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => res.json({ success: true, data: [] }));
router.get('/:id', (req, res) => res.json({ success: true, data: { id: req.params.id } }));
export default router;
