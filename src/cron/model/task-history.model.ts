import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../config/database';
import { Task } from './task.model';

interface TaskHistoryAttributes {
  id: number;
  taskId: number;
  startTime: Date;
  endTime: Date | null;
  serverId: string;
  status: 'success' | 'failed' | 'running';
  error: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskHistoryCreationAttributes extends Omit<TaskHistoryAttributes, 'id'> {
  id?: number;
}

class TaskHistory extends Model<TaskHistoryAttributes, TaskHistoryCreationAttributes> implements TaskHistoryAttributes {
  public id!: number;
  public taskId!: number;
  public startTime!: Date;
  public endTime!: Date | null;
  public serverId!: string;
  public status!: 'success' | 'failed' | 'running';
  public error!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
TaskHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id',
      },
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    serverId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'running'),
      allowNull: false,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'task_history',
    modelName: 'TaskHistory',
  },
);

TaskHistory.belongsTo(Task, { foreignKey: 'taskId' });
Task.hasMany(TaskHistory, { foreignKey: 'taskId' });

export { TaskHistory, TaskHistoryAttributes, TaskHistoryCreationAttributes };
