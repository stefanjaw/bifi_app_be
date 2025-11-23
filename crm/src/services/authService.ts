import User, { UserDocument } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  static async register(data: RegisterInput) {
    const { firstName, lastName, email, password } = data;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('User already exists');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return {
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName }
    };
  }

  static async login({ email, password }: LoginInput) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return {
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName }
    };
  }
}
