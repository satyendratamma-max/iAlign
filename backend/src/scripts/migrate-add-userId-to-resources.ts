import sequelize from '../config/database';
import { QueryInterface, DataTypes } from 'sequelize';

async function addUserIdToResources() {
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  try {
    console.log('Starting migration: Add userId to Resources table...');

    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('Resources');

    if (tableDescription.userId) {
      console.log('Column userId already exists in Resources table. Skipping migration.');
      return;
    }

    // Add userId column
    await queryInterface.addColumn('Resources', 'userId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    console.log('✓ Added userId column to Resources table');

    // Create index for better performance
    await queryInterface.addIndex('Resources', ['userId'], {
      name: 'idx_resources_userId',
    });

    console.log('✓ Created index on userId column');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addUserIdToResources()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default addUserIdToResources;
