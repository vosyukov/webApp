import { Request, Response } from 'express';
import { userService } from '../service/user.service';

class UserController {
  async updateBalance(req: Request<undefined, { userId: string; amount: string }>, res: Response): Promise<void> {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      res.status(400).json({ error: 'Invalid input. userId and amount are required.' });
      return;
    }

    try {
      const result = await userService.updateBalance(userId, amount);

      res.status(200).json({
        success: true,
        message: 'Balance updated successfully',
        user: {
          id: result.id,
          balance: result.balance,
        },
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: 'User not found' });
      } else if (error.message === 'Insufficient balance') {
        res.status(400).json({ error: 'Insufficient balance. Balance cannot be negative.' });
      } else {
        console.error('Error updating balance:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getUserById(req: Request<{ userId: string }>, res: Response): Promise<void> {
    const { userId } = req.params;

    try {
      const user = await userService.getUserById(userId);

      res.status(200).json({
        id: user.id,
        balance: user.balance,
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: 'User not found' });
      } else {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}

export const userController = new UserController();
