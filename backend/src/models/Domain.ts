import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface DomainAttributes {
  id?: number;
  name: string;
  type?: string;
  managerId?: number;
  location?: string;
  createdDate?: Date;
  isActive?: boolean;
}

class Domain extends Model<DomainAttributes> implements DomainAttributes {
  declare id: number;
  declare name: string;
  declare type?: string;
  declare managerId?: number;
  declare location?: string;
  declare createdDate: Date;
  declare isActive: boolean;
}

Domain.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'Domains',
    timestamps: false,
  }
);

export default Domain;
