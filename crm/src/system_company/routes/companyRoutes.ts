import { Router } from 'express';
import {
  getAll,
  create,
  getById,
  update,
  remove
} from '../controllers/companyController';

const router = Router();

router.route('/')
  .get(getAll)
  .post(create);

router.route('/:id')
  .get(getById)
  .put(update)
  .delete(remove);

export default router;