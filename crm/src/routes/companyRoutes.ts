import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getAllCompanies, createCompany } from '../controllers/companyController';

const router = Router();

router.route('/')
  .get(protect, getAllCompanies)
  .post(protect, createCompany);

export default router;
