'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash passwords: SHA-256 + bcrypt (matching your current auth logic)

    // Demo user password: Demo@123
    const demoPlainPassword = 'Demo@123';
    const demoSha256Hash = crypto.createHash('sha256').update(demoPlainPassword).digest('hex');
    const demoHashedPassword = await bcrypt.hash(demoSha256Hash, 12);

    // Admin user password: Admin@123
    const adminPlainPassword = 'Admin@123';
    const adminSha256Hash = crypto.createHash('sha256').update(adminPlainPassword).digest('hex');
    const adminHashedPassword = await bcrypt.hash(adminSha256Hash, 12);

    // Test user password: Test@123
    const testPlainPassword = 'Test@123';
    const testSha256Hash = crypto.createHash('sha256').update(testPlainPassword).digest('hex');
    const testHashedPassword = await bcrypt.hash(testSha256Hash, 12);

    // Insert demo users with raw SQL
    await queryInterface.sequelize.query(`
      INSERT INTO users (name, email, password, created_at, updated_at) VALUES 
      ('Demo User', 'demo@multityper.com', '${demoHashedPassword}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('Admin User', 'admin@multityper.com', '${adminHashedPassword}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('Test User', 'test@multityper.com', '${testHashedPassword}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove seeded users
    await queryInterface.sequelize.query(`
      DELETE FROM users WHERE email IN (
        'demo@multityper.com',
        'admin@multityper.com', 
        'test@multityper.com'
      );
    `);
  }
};
