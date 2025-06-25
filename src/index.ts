import express from 'express';
import dotenv from 'dotenv';

import { runMigrations } from './migrations';

import { userRoutes } from './user/routes/user.routes';

import { cronService } from './cron/service/cron.service';
import { cronRoutes } from './cron/routes/cron.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRoutes);
app.use('/api/cron', cronRoutes);

const startServer = async () => {
  try {
    await runMigrations();

    await cronService.init();
    console.log('Cron service initialized');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
