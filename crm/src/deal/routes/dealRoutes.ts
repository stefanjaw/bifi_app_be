// src/routes/dealRoutes.ts
import { Router } from 'express';
import {
  getAllDeals,
  createDeal,
  getDealById,
  updateDeal,
  deleteDeal,
} from '../controllers/dealController';

const router = Router();

router.route('/')
  .get(getAllDeals)
  .post(createDeal);

router.route('/:id')
  .get(getDealById)
  .put(updateDeal)
  .delete(deleteDeal);

export default router;