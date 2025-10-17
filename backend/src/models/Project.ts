import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectAttributes {
  id?: number;
  projectNumber?: string;
  scenarioId?: number;
  segmentFunctionId?: number;
  domainId?: number;
  name: string;
  description?: string;
  businessProcess?: string;
  functionality?: string;
  status: string;
  priority: string;
  businessDecision: string;
  businessPriority?: string;
  type?: string;
  fiscalYear?: string;
  targetRelease?: string;
  targetSprint?: string;
  progress: number;
  currentPhase?: string;
  budget?: number;
  actualCost?: number;
  forecastedCost?: number;
  plannedOpex?: number;
  plannedCapex?: number;
  totalPlannedCost?: number;
  financialBenefit?: number;
  startDate?: Date;
  endDate?: Date;
  desiredStartDate?: Date;
  desiredCompletionDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  deadline?: Date;
  healthStatus?: string;
  projectManagerId?: number;
  sponsorId?: number;
  needleMover?: string;
  dow?: string;
  investmentClass?: string;
  benefitArea?: string;
  technologyArea?: string;
  enterpriseCategory?: string;
  projectInfrastructureNeeded?: boolean;
  coCreation?: boolean;
  technologyChoice?: string;
  segmentFunction?: string;
  division?: string;
  newOrCarryOver?: string;
  submittedById?: number;
  domainManagerId?: number;
  rank?: number;
  sortOrder?: number;
  createdDate?: Date;
  modifiedDate?: Date;
  isActive?: boolean;
}

class Project extends Model<ProjectAttributes> implements ProjectAttributes {
  declare id: number;
  declare projectNumber?: string;
  declare scenarioId?: number;
  declare segmentFunctionId?: number;
  declare domainId?: number;
  declare name: string;
  declare description?: string;
  declare businessProcess?: string;
  declare functionality?: string;
  declare status: string;
  declare priority: string;
  declare businessDecision: string;
  declare businessPriority?: string;
  declare type?: string;
  declare fiscalYear?: string;
  declare targetRelease?: string;
  declare targetSprint?: string;
  declare progress: number;
  declare currentPhase?: string;
  declare budget?: number;
  declare actualCost?: number;
  declare forecastedCost?: number;
  declare plannedOpex?: number;
  declare plannedCapex?: number;
  declare totalPlannedCost?: number;
  declare financialBenefit?: number;
  declare startDate?: Date;
  declare endDate?: Date;
  declare desiredStartDate?: Date;
  declare desiredCompletionDate?: Date;
  declare actualStartDate?: Date;
  declare actualEndDate?: Date;
  declare deadline?: Date;
  declare healthStatus?: string;
  declare projectManagerId?: number;
  declare sponsorId?: number;
  declare needleMover?: string;
  declare dow?: string;
  declare investmentClass?: string;
  declare benefitArea?: string;
  declare technologyArea?: string;
  declare enterpriseCategory?: string;
  declare projectInfrastructureNeeded?: boolean;
  declare coCreation?: boolean;
  declare technologyChoice?: string;
  declare segmentFunction?: string;
  declare division?: string;
  declare newOrCarryOver?: string;
  declare submittedById?: number;
  declare domainManagerId?: number;
  declare rank?: number;
  declare sortOrder?: number;
  declare createdDate: Date;
  declare modifiedDate: Date;
  declare isActive: boolean;
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    scenarioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    segmentFunctionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    domainId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    businessProcess: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    functionality: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Planning',
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Medium',
    },
    businessDecision: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Pending',
    },
    businessPriority: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fiscalYear: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    targetRelease: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    targetSprint: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    currentPhase: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Requirements',
    },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    actualCost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    forecastedCost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    plannedOpex: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    plannedCapex: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    totalPlannedCost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    financialBenefit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    desiredStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    desiredCompletionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    healthStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'Green',
    },
    projectManagerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sponsorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    needleMover: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    dow: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    investmentClass: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    benefitArea: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    technologyArea: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    enterpriseCategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    projectInfrastructureNeeded: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    coCreation: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    technologyChoice: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    segmentFunction: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    division: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    newOrCarryOver: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    submittedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    domainManagerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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
    tableName: 'Projects',
    timestamps: false,
    hooks: {
      beforeUpdate: (project) => {
        (project as any).modifiedDate = new Date();
      },
    },
    indexes: [
      {
        unique: true,
        fields: ['scenarioId', 'projectNumber'],
        name: 'unique_scenario_project',
      },
    ],
  }
);

export default Project;
