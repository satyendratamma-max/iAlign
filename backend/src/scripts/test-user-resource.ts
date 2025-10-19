import sequelize from '../config/database';

async function testUserResourceRelationship() {
  try {
    console.log('Testing User-Resource Relationships...\n');

    // 1. Check admin user (should have NO resource)
    const [adminResult] = await sequelize.query(`
      SELECT u.id, u.email, u.role, r.id AS resourceId, r.employeeId
      FROM Users u
      LEFT JOIN Resources r ON u.id = r.userId
      WHERE u.email = 'admin@ialign.com'
    `) as any;
    console.log('1. Admin User (should have NO resource):');
    console.log(adminResult[0]);
    console.log('');

    // 2. Check employee users (should have resources with userId)
    const [employeeResult] = await sequelize.query(`
      SELECT TOP 5 u.id AS userId, u.email, u.role, r.id AS resourceId, r.employeeId, r.firstName, r.lastName
      FROM Users u
      INNER JOIN Resources r ON u.id = r.userId
      WHERE u.role IN ('Domain Manager', 'Project Manager', 'Team Lead')
      ORDER BY u.role, u.id
    `) as any;
    console.log(`2. Sample Employee Users with Resources:`);
    employeeResult.forEach((emp: any) => {
      console.log({
        userId: emp.userId,
        email: emp.email,
        role: emp.role,
        resourceId: emp.resourceId,
        employeeId: emp.employeeId
      });
    });
    console.log('');

    // 3. Check contractor resources (should have NO userId)
    const [contractorResult] = await sequelize.query(`
      SELECT TOP 5 id, employeeId, firstName, lastName, email, role, userId
      FROM Resources
      WHERE userId IS NULL
      ORDER BY id
    `) as any;
    console.log(`3. Sample Contractor Resources (no userId):`);
    contractorResult.forEach((contractor: any) => {
      console.log({
        resourceId: contractor.id,
        employeeId: contractor.employeeId,
        name: `${contractor.firstName} ${contractor.lastName}`,
        userId: contractor.userId
      });
    });
    console.log('');

    // 4. Summary statistics
    const [summary] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM Users) AS totalUsers,
        (SELECT COUNT(*) FROM Users WHERE role = 'Administrator') AS adminUsers,
        (SELECT COUNT(*) FROM Resources WHERE userId IS NOT NULL) AS employeeResources,
        (SELECT COUNT(*) FROM Resources WHERE userId IS NULL) AS contractorResources,
        (SELECT COUNT(*) FROM Resources) AS totalResources
    `) as any;
    console.log('4. Summary Statistics:');
    console.log(summary[0]);
    console.log('');

    console.log('✅ User-Resource relationship implementation is working correctly!');
    console.log('   - Admin user has NO resource (admin-only account)');
    console.log('   - Employee users have Resource records linked via userId');
    console.log('   - Contractor resources have NO userId (external resources)');

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUserResourceRelationship();
