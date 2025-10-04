import { Router } from 'express';
import {
  getAllPortfolios,
  getPortfolioById,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getPortfolioStats,
} from '../controllers/portfolio.controller';

const router = Router();

router.get('/', getAllPortfolios);
router.get('/stats', getPortfolioStats);
router.get('/:id', getPortfolioById);
router.post('/', createPortfolio);
router.put('/:id', updatePortfolio);
router.delete('/:id', deletePortfolio);

export default router;
