// src/controllers/contactController.ts
import { Request, Response } from 'express';
import Contact from '../models/Contact';

export const getAllContacts = async (_req: Request, res: Response) => {
  try {
    const contacts = await Contact.find()
      .populate('company', 'name')
      .sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.create(req.body);
    await contact.populate('company', 'name');
    res.status(201).json(contact);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getContactById = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findById(req.params.id).populate('company', 'name');
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(contact);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('company', 'name');

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(contact);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};