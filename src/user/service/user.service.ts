import { Transaction, QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database';

import type { UserAttributes } from '../model/user.model';

class UserService {
  async updateBalance(userId: number, amount: string): Promise<UserAttributes> {
    return await sequelize.transaction(async (t: Transaction) => {
      const [user] = await sequelize.query<UserAttributes>(`SELECT * FROM users WHERE id = :userId FOR UPDATE`, {
        replacements: { userId },
        type: QueryTypes.SELECT,
        transaction: t,
      });

      if (!user) {
        throw new Error('User not found');
      }

      const newBalance = BigInt(user.balance) + BigInt(amount);

      if (newBalance < BigInt(0)) {
        throw new Error('Insufficient balance');
      }

      await sequelize.query(`UPDATE users  SET balance = :balance WHERE id = :userId`, {
        replacements: {
          userId,
          balance: newBalance.toString(),
        },
        type: QueryTypes.UPDATE,
        transaction: t,
      });

      return {
        ...user,
        balance: newBalance.toString(),
      };
    });
  }

  async getUserById(userId: string): Promise<UserAttributes> {
    const [user] = await sequelize.query<UserAttributes>('SELECT * FROM users WHERE id = :userId', {
      replacements: { userId },
      type: QueryTypes.SELECT,
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

export const userService = new UserService();
