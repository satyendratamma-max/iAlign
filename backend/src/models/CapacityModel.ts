import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface CapacityModelAttributes {
  id?: number;
  name: string;
  description?: string;
  modelType: string;
  fiscalYear?: string;
  quarter?: string;
  prioritizationCriteria?: string;
  assumptions?: string;
  createdBy?: number;
  isBaseline: boolean;
  createdDate?: Date;
  modifiedDate?: Date;
  isActive?: boolean;
}

class CapacityModel extends Model<CapacityModelAttributes> implements CapacityModelAttributes {
  declare id: number;
  declare name: string;
  declare description?: string;
  declare modelType: string;
  declare fiscalYear?: string;
  declare quarter?: string;
  declare prioritizationCriteria?: string;
  declare assumptions?: string;
  declare createdBy?: number;
  declare isBaseline: boolean;
  declare createdDate: Date;
  declare modifiedDate: Date;
  declare isActive: boolean;
}

CapacityModel.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    modelType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Baseline',
    },
    fiscalYear: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    quarter: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    prioritizationCriteria: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assumptions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isBaseline: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modifiedDate: {
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
    tableName: 'CapacityModels',
    timestamps: false,
    hooks: {
      beforeUpdate: (model) => {
        (model as any).modifiedDate = new Date();
      },
    },
  }
);

export default CapacityModel;
