import { Router } from 'express';
import {
  getAllTechnologies,
  getTechnologyById,
  createTechnology,
  updateTechnology,
  deleteTechnology,
} from '../controllers/technology.controller';

const router = Router();

router.get('/', getAllTechnologies);
router.get('/:id', getTechnologyById);
router.post('/', createTechnology);
router.put('/:id', updateTechnology);
router.delete('/:id', deleteTechnology);

export default router;
