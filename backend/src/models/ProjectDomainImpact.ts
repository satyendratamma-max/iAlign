import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectDomainImpactAttributes {
  id?: number;
  projectId: number;
  domainId: number;
  impactType: 'Primary' | 'Secondary' | 'Tertiary';
  impactLevel: 'High' | 'Medium' | 'Low';
  description?: string;
  isActive?: boolean;
  createdDate?: Date;
  modifiedDate?: Date;
}

class ProjectDomainImpact extends Model<ProjectDomainImpactAttributes> implements ProjectDomainImpactAttributes {
  declare id: number;
  declare projectId: number;
  declare domainId: number;
  declare impactType: 'Primary' | 'Secondary' | 'Tertiary';
  declare impactLevel: 'High' | 'Medium' | 'Low';
  declare description?: string;
  declare isActive: boolean;
  declare createdDate: Date;
  declare modifiedDate: Date;
}

ProjectDomainImpact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id',
      },
    },
    domainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Domains',
        key: 'id',
      },
    },
    impactType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Secondary',
      validate: {
        isIn: [['Primary', 'Secondary', 'Tertiary']],
      },
    },
    impactLevel: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Medium',
      validate: {
        isIn: [['High', 'Medium', 'Low']],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    modifiedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'ProjectDomainImpacts',
    timestamps: false,
    hooks: {
      beforeUpdate: (impact) => {
        (impact as any).modifiedDate = new Date();
      },
    },
    indexes: [
      {
        fields: ['projectId'],
      },
      {
        fields: ['domainId'],
      },
      {
        unique: true,
        fields: ['projectId', 'domainId'],
      },
    ],
  }
);

export default ProjectDomainImpact;
