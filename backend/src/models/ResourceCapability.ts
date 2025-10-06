import { Model, DataTypes, Op } from 'sequelize';
import sequelize from '../config/database';

export interface ResourceCapabilityAttributes {
  id?: number;
  resourceId: number;
  appId: number;
  technologyId: number;
  roleId: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  isPrimary: boolean;
  yearsOfExperience?: number;
  certifications?: string;
  lastUsedDate?: Date;
  endorsements?: number;
  isActive?: boolean;
  createdDate?: Date;
  modifiedDate?: Date;
}

class ResourceCapability extends Model<ResourceCapabilityAttributes> implements ResourceCapabilityAttributes {
  declare id: number;
  declare resourceId: number;
  declare appId: number;
  declare technologyId: number;
  declare roleId: number;
  declare proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  declare isPrimary: boolean;
  declare yearsOfExperience?: number;
  declare certifications?: string;
  declare lastUsedDate?: Date;
  declare endorsements?: number;
  declare isActive: boolean;
  declare createdDate: Date;
  declare modifiedDate: Date;
}

ResourceCapability.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK to Resources',
    },
    appId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK to Apps',
    },
    technologyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK to Technologies',
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK to Roles',
    },
    proficiencyLevel: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Intermediate',
      validate: {
        isIn: [['Beginner', 'Intermediate', 'Advanced', 'Expert']],
      },
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Only one primary capability per resource',
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Years of experience with this capability',
    },
    certifications: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Comma-separated list or JSON array of certifications',
    },
    lastUsedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time this capability was used on a project',
    },
    endorsements: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of internal endorsements',
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
    tableName: 'ResourceCapabilities',
    timestamps: false,
    indexes: [
      {
        name: 'idx_capability_resource_id',
        fields: ['resourceId'],
      },
      {
        name: 'idx_capability_app_id',
        fields: ['appId'],
      },
      {
        name: 'idx_capability_technology_id',
        fields: ['technologyId'],
      },
      {
        name: 'idx_capability_role_id',
        fields: ['roleId'],
      },
      {
        name: 'idx_capability_unique',
        unique: true,
        fields: ['resourceId', 'appId', 'technologyId', 'roleId'],
      },
    ],
    hooks: {
      beforeValidate: async (capability: ResourceCapability) => {
        // Import models dynamically to avoid circular dependencies
        const App = (await import('./App')).default;
        const Technology = (await import('./Technology')).default;
        const Role = (await import('./Role')).default;

        // Load related entities for validation
        const [app, technology, role] = await Promise.all([
          App.findByPk(capability.appId),
          Technology.findByPk(capability.technologyId),
          Role.findByPk(capability.roleId),
        ]);

        if (!app) {
          throw new Error(`App with ID ${capability.appId} not found`);
        }

        if (!technology) {
          throw new Error(`Technology with ID ${capability.technologyId} not found`);
        }

        if (!role) {
          throw new Error(`Role with ID ${capability.roleId} not found`);
        }

        // ⭐ CASCADE VALIDATION 1: Technology must belong to App (if app-specific)
        if (technology.appId && technology.appId !== capability.appId) {
          throw new Error(
            `Technology "${technology.name}" is specific to app ID ${technology.appId}, ` +
            `but you selected app "${app.name}" (ID: ${capability.appId}). ` +
            `Please select a technology that belongs to this app or use a global technology.`
          );
        }

        // ⭐ CASCADE VALIDATION 2: Role must belong to App (if app-specific)
        if (role.appId && role.appId !== capability.appId) {
          throw new Error(
            `Role "${role.name}" is specific to app ID ${role.appId}, ` +
            `but you selected app "${app.name}" (ID: ${capability.appId}). ` +
            `Please select a role that belongs to this app or use a global role.`
          );
        }

        // ⭐ CASCADE VALIDATION 3: Role must belong to Technology (if tech-specific)
        if (role.technologyId && role.technologyId !== capability.technologyId) {
          throw new Error(
            `Role "${role.name}" is specific to technology ID ${role.technologyId}, ` +
            `but you selected technology "${technology.name}" (ID: ${capability.technologyId}). ` +
            `Please select a compatible role.`
          );
        }

        // ⭐ PRIMARY VALIDATION: Only one primary capability per resource
        if (capability.isPrimary) {
          const existingPrimary = await ResourceCapability.findOne({
            where: {
              resourceId: capability.resourceId,
              isPrimary: true,
              id: { [Op.ne]: capability.id || 0 }, // Exclude self when updating
            },
          });

          if (existingPrimary) {
            throw new Error(
              `Resource already has a primary capability (ID: ${existingPrimary.id}). ` +
              `Please set isPrimary=false on the existing primary capability first.`
            );
          }
        }
      },
      beforeUpdate: (capability: ResourceCapability) => {
        capability.modifiedDate = new Date();
      },
    },
  }
);

export default ResourceCapability;
