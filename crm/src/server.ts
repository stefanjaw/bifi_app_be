import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import connectDB from './config/database';

import authRoutes from './routes/authRoutes';
import companyRoutes from './routes/companyRoutes';

const app: Application = express();
connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.send('CRM API Running (TypeScript)'));

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
