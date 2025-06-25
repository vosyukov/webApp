import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../config/database';

interface UserAttributes {
  id: number;
  balance: string;
}

interface UserCreationAttributes extends Omit<UserAttributes, 'id'> {
  id?: number;
}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public balance!: string;
}
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    balance: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
  },
);

export { User, UserAttributes };
