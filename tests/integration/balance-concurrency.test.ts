import request from 'supertest';
import express from 'express';
import { sequelize } from '../../src/config/database';
import dotenv from 'dotenv';

import { runMigrations } from '../../src/migrations';
import { userRoutes } from '../../src/user/routes/user.routes';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/users', userRoutes);

describe('Balance Concurrency Test', () => {
  let userId: number;
  const initialBalance = '10000';
  const withdrawalAmount = 2;
  const totalRequests = 10000;

  beforeAll(async () => {
    try {
      await sequelize.authenticate();

      await runMigrations();

      const [result] = await sequelize.query(`INSERT INTO users (balance) VALUES (:balance) RETURNING id`, {
        replacements: {
          balance: initialBalance,
        },
        type: 'INSERT',
      });

      userId = (result as any[])[0].id;
      console.log(`Test user created with ID: ${userId}`);
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      if (userId !== undefined) {
        await sequelize.query(`DELETE FROM users WHERE id = :userId`, {
          replacements: { userId },
          type: 'DELETE',
        });
      }
    } catch (error) {
      console.error('Error cleaning up test user:', error);
    } finally {
      await sequelize.close();
    }
  });

  it('should handle concurrent balance withdrawal requests correctly', async () => {
    const requests = Array(totalRequests)
      .fill(null)
      .map(() =>
        request(app)
          .post('/api/users/update-balance')
          .send({
            userId: userId,
            amount: `-${withdrawalAmount}`,
          }),
      );

    const responses = await Promise.all(requests);

    const successfulResponses = responses.filter(res => res.status === 200);
    const failedResponses = responses.filter(res => res.status === 400);

    expect(successfulResponses.length).toBe(5000);
    expect(failedResponses.length).toBe(5000);

    await sequelize.query(`UPDATE users SET balance = 0 WHERE id = :userId`, {
      replacements: { userId },
      type: 'UPDATE',
    });
  }, 60000);
});
