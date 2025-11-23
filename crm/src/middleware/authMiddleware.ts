import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
  user: { id: string };
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) return res.status(401).json({ msg: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
