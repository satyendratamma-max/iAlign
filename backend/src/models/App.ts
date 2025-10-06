import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface AppAttributes {
  id?: number;
  name: string;
  code: string;
  category: string;
  description?: string;
  vendor?: string;
  isGlobal: boolean;
  status: 'Active' | 'Deprecated' | 'Sunset';
  owner?: string;
  criticality?: 'Critical' | 'High' | 'Medium' | 'Low';
  isActive?: boolean;
  createdDate?: Date;
  modifiedDate?: Date;
}

class App extends Model<AppAttributes> implements AppAttributes {
  declare id: number;
  declare name: string;
  declare code: string;
  declare category: string;
  declare description?: string;
  declare vendor?: string;
  declare isGlobal: boolean;
  declare status: 'Active' | 'Deprecated' | 'Sunset';
  declare owner?: string;
  declare criticality?: 'Critical' | 'High' | 'Medium' | 'Low';
  declare isActive: boolean;
  declare createdDate: Date;
  declare modifiedDate: Date;
}

App.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'ERP, CRM, Cloud, Database, Platform, etc.',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vendor: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Vendor/provider name',
    },
    isGlobal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'If true, this is a global/cross-functional app',
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Active',
      validate: {
        isIn: [['Active', 'Deprecated', 'Sunset']],
      },
    },
    owner: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Business owner or department',
    },
    criticality: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['Critical', 'High', 'Medium', 'Low']],
      },
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
    tableName: 'Apps',
    timestamps: false,
    hooks: {
      beforeUpdate: (app: App) => {
        app.modifiedDate = new Date();
      },
    },
  }
);

export default App;
