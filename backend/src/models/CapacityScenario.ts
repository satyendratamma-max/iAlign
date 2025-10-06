import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface CapacityScenarioAttributes {
  id?: number;
  capacityModelId: number;
  domainId?: number;
  appId?: number;
  technologyId?: number;
  roleId?: number;
  scenarioName: string;
  description?: string;
  totalDemandHours?: number;
  totalSupplyHours?: number;
  utilizationRate?: number;
  overAllocationHours?: number;
  skillType?: string;
  fiscalPeriod?: string;
  calculations?: string;
  recommendations?: string;
  createdDate?: Date;
  modifiedDate?: Date;
}

class CapacityScenario extends Model<CapacityScenarioAttributes> implements CapacityScenarioAttributes {
  declare id: number;
  declare capacityModelId: number;
  declare domainId?: number;
  declare appId?: number;
  declare technologyId?: number;
  declare roleId?: number;
  declare scenarioName: string;
  declare description?: string;
  declare totalDemandHours?: number;
  declare totalSupplyHours?: number;
  declare utilizationRate?: number;
  declare overAllocationHours?: number;
  declare skillType?: string;
  declare fiscalPeriod?: string;
  declare calculations?: string;
  declare recommendations?: string;
  declare createdDate: Date;
  declare modifiedDate: Date;
}

CapacityScenario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    capacityModelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    domainId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    appId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'FK to Apps - Identifies the application context for this scenario',
    },
    technologyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'FK to Technologies - Identifies the technology context for this scenario',
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'FK to Roles - Identifies the role context for this scenario',
    },
    scenarioName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalDemandHours: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    totalSupplyHours: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    utilizationRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    overAllocationHours: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    skillType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    fiscalPeriod: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    calculations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recommendations: {
      type: DataTypes.TEXT,
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
  },
  {
    sequelize,
    tableName: 'CapacityScenarios',
    timestamps: false,
    hooks: {
      beforeUpdate: (scenario) => {
        (scenario as any).modifiedDate = new Date();
      },
    },
  }
);

export default CapacityScenario;
