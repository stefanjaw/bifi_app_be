import { Request, Response } from 'express';
import Company from '../models/Company';

export const getAll = async (_req: Request, res: Response) => {
  const companies = await Company.find().sort({ createdAt: -1 });
  res.json(companies);
};

export const create = async (req: Request, res: Response) => {
  const company = await Company.create(req.body);
  res.status(201).json(company);
};

export const getById = async (req: Request, res: Response) => {
  const company = await Company.findById(req.params.id);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json(company);
};

export const update = async (req: Request, res: Response) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json(company);
};

export const remove = async (req: Request, res: Response) => {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json({ message: 'Deleted' });
};