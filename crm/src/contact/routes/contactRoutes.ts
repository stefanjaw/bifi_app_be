// src/routes/contactRoutes.ts
import { Router } from 'express';
import {
  getAllContacts,
  createContact,
  getContactById,
  updateContact,
  deleteContact,
} from '../controllers/contactController';

const router = Router();

// GET    /api/contacts          → List all
// POST   /api/contacts          → Create new
// GET    /api/contacts/:id      → Get one
// PUT    /api/contacts/:id      → Update
// DELETE /api/contacts/:id      → Delete

router.route('/')
  .get(getAllContacts)
  .post(createContact);

router.route('/:id')
  .get(getContactById)
  .put(updateContact)
  .delete(deleteContact);

export default router;