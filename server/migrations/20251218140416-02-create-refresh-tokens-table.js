'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create refresh_tokens table with raw SQL
    await queryInterface.sequelize.query(`
      CREATE TABLE refresh_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(500) NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_refresh_tokens_user_id 
          FOREIGN KEY (user_id) 
          REFERENCES users(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE
      );
    `);

    // Add indexes for better performance
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
      CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked);
    `);

    // Add trigger for updated_at
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_refresh_tokens_updated_at 
      BEFORE UPDATE ON refresh_tokens 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS refresh_tokens CASCADE;`);
  }
};
