import { QueryInterface, DataTypes } from 'sequelize';
import sequelize from '../config/database';

async function addTargetFields() {
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if columns already exist
    const tableDescription = await queryInterface.describeTable('Projects');

    if (!tableDescription.targetRelease) {
      console.log('➕ Adding targetRelease column...');
      await queryInterface.addColumn('Projects', 'targetRelease', {
        type: DataTypes.STRING(50),
        allowNull: true,
      });
      console.log('✅ targetRelease column added');
    } else {
      console.log('✓ targetRelease column already exists');
    }

    if (!tableDescription.targetSprint) {
      console.log('➕ Adding targetSprint column...');
      await queryInterface.addColumn('Projects', 'targetSprint', {
        type: DataTypes.STRING(50),
        allowNull: true,
      });
      console.log('✅ targetSprint column added');
    } else {
      console.log('✓ targetSprint column already exists');
    }

    console.log('\n✅ Migration completed successfully');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

addTargetFields();
