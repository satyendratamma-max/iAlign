const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();

const newPassword = 'Admin@123'; // Change this to your desired password

async function resetAdminPassword() {
  const db = new sqlite3.Database('./database.sqlite');

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    db.run(
      `UPDATE Users SET passwordHash = ? WHERE email = 'admin@ialign.com'`,
      [passwordHash],
      function (err) {
        if (err) {
          console.error('Error updating password:', err.message);
          return;
        }
        console.log('✅ Admin password has been reset successfully!');
        console.log('Email: admin@ialign.com');
        console.log('Password:', newPassword);
        console.log('\nYou can now log in with these credentials.');
        db.close();
      }
    );
  } catch (error) {
    console.error('Error:', error);
    db.close();
  }
}

resetAdminPassword();
