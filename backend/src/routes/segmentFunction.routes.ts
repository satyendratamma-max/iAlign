import { Router } from 'express';
import {
  getAllSegmentFunctions,
  getSegmentFunctionById,
  createSegmentFunction,
  updateSegmentFunction,
  deleteSegmentFunction,
  getSegmentFunctionStats,
  getSegmentFunctionRisk,
} from '../controllers/segmentFunction.controller';

const router = Router();

router.get('/', getAllSegmentFunctions);
router.get('/stats', getSegmentFunctionStats);
router.get('/:id/risk', getSegmentFunctionRisk); // New risk calculation endpoint
router.get('/:id', getSegmentFunctionById);
router.post('/', createSegmentFunction);
router.put('/:id', updateSegmentFunction);
router.delete('/:id', deleteSegmentFunction);

export default router;
