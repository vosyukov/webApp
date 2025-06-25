import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../config/database';

interface TaskAttributes {
  id: number;
  name: string;
  interval: number;
  function: string;
  lastRun: Date | null;
  nextRun: Date | null;
  isRunning: boolean;
  serverId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes extends Omit<TaskAttributes, 'id'> {
  id?: number;
}

class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: number;
  public name!: string;
  public interval!: number;
  public function!: string;
  public lastRun!: Date | null;
  public nextRun!: Date | null;
  public isRunning!: boolean;
  public serverId!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    interval: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    function: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastRun: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextRun: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isRunning: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    serverId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    modelName: 'Task',
  },
);

export { Task, TaskAttributes, TaskCreationAttributes };
