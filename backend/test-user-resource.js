const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'mssql',
  host: 'localhost',
  port: 1433,
  database: 'iAlign',
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  },
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'YourStrong@Passw0rd'
    }
  },
  logging: false
});

async function testUserResourceRelationship() {
  try {
    console.log('Testing User-Resource Relationships...\n');

    // 1. Check admin user (should have NO resource)
    const [adminResult] = await sequelize.query(`
      SELECT u.id, u.email, u.role, r.id AS resourceId, r.employeeId
      FROM Users u
      LEFT JOIN Resources r ON u.id = r.userId
      WHERE u.email = 'admin@ialign.com'
    `);
    console.log('1. Admin User (should have NO resource):');
    console.log(adminResult);
    console.log('');

    // 2. Check employee users (should have resources with userId)
    const [employeeResult] = await sequelize.query(`
      SELECT u.id AS userId, u.email, u.role, r.id AS resourceId, r.employeeId, r.firstName, r.lastName
      FROM Users u
      INNER JOIN Resources r ON u.id = r.userId
      WHERE u.role IN ('Domain Manager', 'Project Manager', 'Team Lead')
      ORDER BY u.role, u.id
    `);
    console.log(`2. Employee Users with Resources (found ${employeeResult.length}):` );
    console.log(employeeResult.slice(0, 5).map(r => ({
      userId: r.userId,
      email: r.email,
      role: r.role,
      resourceId: r.resourceId,
      employeeId: r.employeeId
    })));
    console.log(`   ... and ${employeeResult.length - 5} more\n`);

    // 3. Check contractor resources (should have NO userId)
    const [contractorResult] = await sequelize.query(`
      SELECT id, employeeId, firstName, lastName, email, role, userId
      FROM Resources
      WHERE userId IS NULL
      ORDER BY id
    `);
    console.log(`3. Contractor Resources (no userId, found ${contractorResult.length}):`);
    console.log(contractorResult.slice(0, 5).map(r => ({
      resourceId: r.id,
      employeeId: r.employeeId,
      name: `${r.firstName} ${r.lastName}`,
      userId: r.userId
    })));
    console.log(`   ... and ${contractorResult.length - 5} more\n`);

    // 4. Summary statistics
    const [summary] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM Users) AS totalUsers,
        (SELECT COUNT(*) FROM Users WHERE role = 'Administrator') AS adminUsers,
        (SELECT COUNT(*) FROM Resources WHERE userId IS NOT NULL) AS employeeResources,
        (SELECT COUNT(*) FROM Resources WHERE userId IS NULL) AS contractorResources,
        (SELECT COUNT(*) FROM Resources) AS totalResources
    `);
    console.log('4. Summary Statistics:');
    console.log(summary[0]);

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUserResourceRelationship();
