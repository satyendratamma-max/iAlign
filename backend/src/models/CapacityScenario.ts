import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface CapacityScenarioAttributes {
  id?: number;
  capacityModelId: number;
  domainId?: number;
  domainTeamId?: number;
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
  declare domainTeamId?: number;
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
    domainTeamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
