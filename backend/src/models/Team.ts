import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface TeamAttributes {
  id?: number;
  domainId: number;
  name: string;
  skillType?: string;
  type?: string;
  leadId?: number;
  location?: string;
  totalMembers?: number;
  totalCapacityHours?: number;
  utilizationRate?: number;
  monthlyCost?: number;
  createdDate?: Date;
  isActive?: boolean;
}

class Team extends Model<TeamAttributes> implements TeamAttributes {
  declare id: number;
  declare domainId: number;
  declare name: string;
  declare skillType?: string;
  declare type?: string;
  declare leadId?: number;
  declare location?: string;
  declare totalMembers?: number;
  declare totalCapacityHours?: number;
  declare utilizationRate?: number;
  declare monthlyCost?: number;
  declare createdDate: Date;
  declare isActive: boolean;
}

Team.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    domainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    skillType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    totalMembers: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    totalCapacityHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    utilizationRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    monthlyCost: {
      type: DataTypes.DECIMAL(15, 2),
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
    tableName: 'Teams',
    timestamps: false,
  }
);

export default Team;
