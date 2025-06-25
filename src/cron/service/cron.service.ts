import { v4 as uuidv4 } from 'uuid';
import { Task } from '../model/task.model';
import { TaskHistory } from '../model/task-history.model';
import { sequelize } from '../../config/database';
import { QueryTypes } from 'sequelize';

const SERVER_ID = uuidv4();

const taskFunctions: Record<string, () => Promise<void>> = {
  processData: async () => {
    console.log(`[${SERVER_ID}] Starting processData task`);
    await new Promise(resolve => setTimeout(resolve, 120000));
    console.log(`[${SERVER_ID}] Completed processData task`);
  },

  generateReports: async () => {
    console.log(`[${SERVER_ID}] Starting generateReports task`);
    await new Promise(resolve => setTimeout(resolve, 120000));
    console.log(`[${SERVER_ID}] Completed generateReports task`);
  },

  cleanOldData: async () => {
    console.log(`[${SERVER_ID}] Starting cleanOldData task`);
    await new Promise(resolve => setTimeout(resolve, 120000));
    console.log(`[${SERVER_ID}] Completed cleanOldData task`);
  },

  syncExternalSystems: async () => {
    console.log(`[${SERVER_ID}] Starting syncExternalSystems task`);
    await new Promise(resolve => setTimeout(resolve, 120000));
    console.log(`[${SERVER_ID}] Completed syncExternalSystems task`);
  },

  backupDatabase: async () => {
    console.log(`[${SERVER_ID}] Starting backupDatabase task`);
    await new Promise(resolve => setTimeout(resolve, 120000));
    console.log(`[${SERVER_ID}] Completed backupDatabase task`);
  },
};

class CronService {
  private isRunning = false;
  private checkInterval = 5000;
  private intervalId: NodeJS.Timeout | null = null;

  async init(): Promise<void> {
    console.log(`Initializing cron service with server ID: ${SERVER_ID}`);

    await this.createDefaultTasks();

    this.start();
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => this.checkAndRunTasks(), this.checkInterval);
    console.log('Cron scheduler started');
  }

  stop(): void {
    if (!this.isRunning || !this.intervalId) {
      return;
    }

    clearInterval(this.intervalId);
    this.isRunning = false;
    this.intervalId = null;
    console.log('Cron scheduler stopped');
  }

  private async createDefaultTasks(): Promise<void> {
    console.log('Creating default tasks...');

    const defaultTasks = [
      { name: 'Process Data', interval: 300, function: 'processData' },
      { name: 'Generate Reports', interval: 600, function: 'generateReports' },
      { name: 'Clean Old Data', interval: 900, function: 'cleanOldData' },
      { name: 'Sync External Systems', interval: 1200, function: 'syncExternalSystems' },
      { name: 'Backup Database', interval: 1500, function: 'backupDatabase' },
    ];

    for (const task of defaultTasks) {
      const now = new Date().toISOString();
      console.log(`Creating task ${task.name}...`);

      await sequelize.query(
        `INSERT INTO tasks (
            name,
            interval,
            function,
            "isRunning",
            "nextRun",
            "createdAt",
            "updatedAt"
        )
         VALUES (
                    :name,
                    :interval,
                    :function,
                    :isRunning,
                    :nextRun,
                    :createdAt,
                    :updatedAt
                )
             ON CONFLICT (name) DO NOTHING;`,
        {
          replacements: {
            name: task.name,
            interval: task.interval,
            function: task.function,
            isRunning: false,
            nextRun: now,
            createdAt: now,
            updatedAt: now,
          },
          type: QueryTypes.INSERT,
        },
      );
    }
  }

  private async checkAndRunTasks(): Promise<void> {
    const now = new Date();
    const nowIso = now.toISOString();

    await sequelize.transaction(async transaction => {
      const [dueTask] = await sequelize.query<Task>(
        `SELECT * FROM tasks WHERE ("nextRun" <= :now OR "nextRun" IS NULL) AND "isRunning" = false FOR UPDATE SKIP LOCKED LIMIT 1`,
        {
          replacements: { now: nowIso },
          type: QueryTypes.SELECT,
          transaction,
        },
      );
      if (dueTask) {
        await sequelize.query(
          `UPDATE tasks 
               SET "isRunning" = true, 
                   "serverId" = :serverId, 
                   "lastRun" = :lastRun,
                   "updatedAt" = :updatedAt
               WHERE id = :id`,
          {
            replacements: {
              id: dueTask.id,
              serverId: SERVER_ID,
              lastRun: nowIso,
              updatedAt: nowIso,
            },
            type: 'UPDATE',
            transaction,
          },
        );

        const [historyResult] = await sequelize.query(
          `INSERT INTO task_history 
               ("taskId", "startTime", "serverId", status, "createdAt", "updatedAt") 
               VALUES (:taskId, :startTime, :serverId, :status, :createdAt, :updatedAt) RETURNING id`,
          {
            replacements: {
              taskId: dueTask.id,
              startTime: nowIso,
              serverId: SERVER_ID,
              status: 'running',
              createdAt: nowIso,
              updatedAt: nowIso,
            },
            type: QueryTypes.INSERT,
            transaction,
          },
        );

        // @ts-ignore
        const insertedId = historyResult[0].id as number;

        transaction.afterCommit(() => {
          this.executeTask(dueTask, insertedId);
        });
      }
    });
  }

  private async executeTask(task: Task, historyId: number): Promise<void> {
    try {
      console.log(`[${SERVER_ID}] Executing task: ${task.name}`);

      const taskFunction = taskFunctions[task.function];

      if (!taskFunction) {
        throw new Error(`Task function not found: ${task.function}`);
      }

      await taskFunction();

      const endTime = new Date();
      const endTimeIso = endTime.toISOString();
      const nextRun = new Date(endTime.getTime() + task.interval * 1000);
      const nextRunIso = nextRun.toISOString();

      await sequelize.transaction(async transaction => {
        await sequelize.query(
          `UPDATE tasks 
           SET "isRunning" = false, 
               "serverId" = NULL, 
               "nextRun" = :nextRun,
               "updatedAt" = :updatedAt
           WHERE id = :id`,
          {
            replacements: {
              id: task.id,
              nextRun: nextRunIso,
              updatedAt: endTimeIso,
            },
            type: 'UPDATE',
            transaction,
          },
        );

        await sequelize.query(
          `UPDATE task_history 
           SET "endTime" = :endTime, 
               status = :status,
               "updatedAt" = :updatedAt
           WHERE id = :id`,
          {
            replacements: {
              id: historyId,
              endTime: endTimeIso,
              status: 'success',
              updatedAt: endTimeIso,
            },
            type: 'UPDATE',
            transaction,
          },
        );
      });

      console.log(`[${SERVER_ID}] Task completed: ${task.name}, next run at ${nextRun}`);
    } catch (error) {
      console.error(`[${SERVER_ID}] Error executing task ${task.name}:`, error);

      const now = new Date();
      const nowIso = now.toISOString();
      const nextRun = new Date(now.getTime() + task.interval * 1000);
      const nextRunIso = nextRun.toISOString();

      await sequelize.transaction(async transaction => {
        await sequelize.query(
          `UPDATE tasks 
           SET "isRunning" = false, 
               "serverId" = NULL, 
               "nextRun" = :nextRun,
               "updatedAt" = :updatedAt
           WHERE id = :id`,
          {
            replacements: {
              id: task.id,
              nextRun: nextRunIso,
              updatedAt: nowIso,
            },
            type: 'UPDATE',
            transaction,
          },
        );

        await sequelize.query(
          `UPDATE task_history 
           SET "endTime" = :endTime, 
               status = :status,
               error = :error,
               "updatedAt" = :updatedAt
           WHERE id = :id`,
          {
            replacements: {
              id: historyId,
              endTime: nowIso,
              status: 'failed',
              error: error instanceof Error ? error.message : String(error),
              updatedAt: nowIso,
            },
            type: 'UPDATE',
            transaction,
          },
        );
      });
    }
  }

  async getAllTasks(): Promise<any[]> {
    console.log('Getting all tasks...');
    const tasks = await Task.findAll({
      order: [['id', 'ASC']],
    });

    console.log('Raw tasks from database:', tasks);

    const now = new Date();
    const tasksArray = tasks.map(task => task.get({ plain: true }));
    console.log('Tasks array:', tasksArray);

    return tasksArray.map((task: any) => {
      const runningTime = task.isRunning && task.lastRun ? Math.floor((now.getTime() - new Date(task.lastRun).getTime()) / 1000) : 0;

      return {
        id: task.id,
        name: task.name,
        interval: task.interval,
        function: task.function,
        lastRun: task.lastRun ? new Date(task.lastRun) : null,
        nextRun: task.nextRun ? new Date(task.nextRun) : null,
        isRunning: task.isRunning,
        serverId: task.serverId,
        runningTime: runningTime,
        status: task.isRunning ? 'running' : task.nextRun && new Date(task.nextRun) > now ? 'scheduled' : 'pending',
        history: task.history_id
          ? {
              id: task.history_id,
              startTime: task.history_startTime ? new Date(task.history_startTime) : null,
              endTime: task.history_endTime ? new Date(task.history_endTime) : null,
              serverId: task.history_serverId,
              status: task.history_status,
              error: task.history_error,
            }
          : null,
      };
    });
  }

  async getTaskHistory(taskId?: number): Promise<any[]> {
    console.log('Getting task history for taskId:', taskId);
    const whereClause = taskId ? { taskId } : {};
    const histories = await TaskHistory.findAll({
      where: whereClause,
      order: [['startTime', 'DESC']],
      limit: 100,
    });

    console.log('Raw task history from database:', histories);
    return histories.map(history => history.get({ plain: true }));
  }
}

export const cronService = new CronService();
export { taskFunctions };
