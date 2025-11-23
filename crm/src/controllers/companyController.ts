import { Request, Response } from 'express';
import Company from '../models/Company';

export const getAllCompanies = async (req: Request, res: Response) => {
  const companies = await Company.find().populate('owner', 'firstName email');
  res.json(companies);
};

export const createCompany = async (req: Request, res: Response) => {
  const company = await Company.create({
    ...req.body,
    owner: req.user!.id
  });
  res.status(201).json(company);
};
