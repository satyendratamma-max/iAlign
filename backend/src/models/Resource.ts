import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface ResourceAttributes {
  id?: number;
  domainId?: number;
  portfolioId?: number;
  domainTeamId?: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  primarySkill?: string;
  secondarySkills?: string;
  role?: string;
  location?: string;
  timezone?: string;
  hourlyRate?: number;
  monthlyCost?: number;
  totalCapacityHours?: number;
  utilizationRate?: number;
  homeLocation?: string;
  isRemote?: boolean;
  isActive?: boolean;
  createdDate?: Date;
}

class Resource extends Model<ResourceAttributes> implements ResourceAttributes {
  declare id: number;
  declare domainId?: number;
  declare portfolioId?: number;
  declare domainTeamId?: number;
  declare employeeId: string;
  declare firstName?: string;
  declare lastName?: string;
  declare email?: string;
  declare primarySkill?: string;
  declare secondarySkills?: string;
  declare role?: string;
  declare location?: string;
  declare timezone?: string;
  declare hourlyRate?: number;
  declare monthlyCost?: number;
  declare totalCapacityHours?: number;
  declare utilizationRate?: number;
  declare homeLocation?: string;
  declare isRemote?: boolean;
  declare isActive: boolean;
  declare createdDate: Date;
}

Resource.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    domainId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    portfolioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    domainTeamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    employeeId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    primarySkill: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    secondarySkills: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    monthlyCost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    totalCapacityHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 160,
    },
    utilizationRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    homeLocation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    isRemote: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'Resources',
    timestamps: false,
  }
);

export default Resource;
