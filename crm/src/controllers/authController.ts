import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.login(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
