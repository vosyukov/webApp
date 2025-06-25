import { Request, Response } from 'express';
import { cronService } from '../service/cron.service';

class CronController {
  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await cronService.getAllTasks();
      res.status(200).json(tasks);
    } catch (error) {
      console.error('Error getting tasks:', error);
      res.status(500).json({ error: 'Failed to get tasks' });
    }
  }
  async getTaskHistory(req: Request, res: Response): Promise<void> {
    try {
      const taskId = req.params.taskId ? parseInt(req.params.taskId) : undefined;
      const history = await cronService.getTaskHistory(taskId);
      res.status(200).json(history);
    } catch (error) {
      console.error('Error getting task history:', error);
      res.status(500).json({ error: 'Failed to get task history' });
    }
  }
}

export const cronController = new CronController();
