// src/controllers/dealController.ts
import { Request, Response } from 'express';
import Deal from '../models/Deal';

export const getAllDeals = async (_req: Request, res: Response) => {
  try {
    const deals = await Deal.find()
      .populate('contact', 'firstName lastName email')
      .populate('company', 'name')
      .populate('owner', 'firstName email')
      .sort({ createdAt: -1 });
    res.json(deals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createDeal = async (req: Request, res: Response) => {
  try {
    const deal = await Deal.create(req.body);
    await deal.populate([
      { path: 'contact', select: 'firstName lastName email' },
      { path: 'company', select: 'name' },
      { path: 'owner', select: 'firstName email' },
    ]);
    res.status(201).json(deal);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getDealById = async (req: Request, res: Response) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('contact', 'firstName lastName email')
      .populate('company', 'name')
      .populate('owner', 'firstName email');

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    res.json(deal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDeal = async (req: Request, res: Response) => {
  try {
    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('contact', 'firstName lastName email')
      .populate('company', 'name')
      .populate('owner', 'firstName email');

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    res.json(deal);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteDeal = async (req: Request, res: Response) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    res.json({ message: 'Deal deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};