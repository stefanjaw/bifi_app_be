import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database';

import companyRoutes from './routes/companyRoutes';
// import contactRoutes from './routes/contactRoutes';
// import dealRoutes from './routes/dealRoutes';

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('CRM API – No Auth Mode (Ready for Development)');
});

app.use('/api/companies', companyRoutes);
// app.use('/api/contacts', contactRoutes);
// app.use('/api/deals', dealRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});