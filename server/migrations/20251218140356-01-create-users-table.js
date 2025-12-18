'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create users table with raw SQL for better control
    await queryInterface.sequelize.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add indexes for better performance
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_users_email ON users(email);
    `);

    // Add trigger to auto-update updated_at column
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS users CASCADE;`);
    await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;`);
  }
};
