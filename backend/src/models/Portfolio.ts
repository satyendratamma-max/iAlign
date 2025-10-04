import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface PortfolioAttributes {
  id?: number;
  domainId?: number;
  name: string;
  description?: string;
  type?: string;
  totalValue?: number;
  roiIndex?: number;
  riskScore?: number;
  managerId?: number;
  createdDate?: Date;
  modifiedDate?: Date;
  isActive?: boolean;
}

class Portfolio extends Model<PortfolioAttributes> implements PortfolioAttributes {
  declare id: number;
  declare domainId?: number;
  declare name: string;
  declare description?: string;
  declare type?: string;
  declare totalValue?: number;
  declare roiIndex?: number;
  declare riskScore?: number;
  declare managerId?: number;
  declare createdDate: Date;
  declare modifiedDate: Date;
  declare isActive: boolean;
}

Portfolio.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    domainId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Domains',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    totalValue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    roiIndex: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    riskScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    tableName: 'Portfolios',
    timestamps: false,
    hooks: {
      beforeUpdate: (portfolio) => {
        (portfolio as any).modifiedDate = new Date();
      },
    },
  }
);

export default Portfolio;
