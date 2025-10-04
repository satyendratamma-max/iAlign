import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Notification extends Model {
  declare id: number;
  declare userId: number;
  declare type: string;
  declare title: string;
  declare message: string;
  declare isRead: boolean;
  declare createdDate: Date;
  declare updatedDate: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'info',
      comment: 'Notification type: info, success, warning, error',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read',
    },
    createdDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_date',
    },
    updatedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_date',
    },
  },
  {
    sequelize,
    tableName: 'Notifications',
    timestamps: false,
  }
);

export default Notification;
