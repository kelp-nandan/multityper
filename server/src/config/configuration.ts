export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    type: process.env.DATABASE_TYPE || 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://admin:admin123@localhost:5432/testdb',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresInDays: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  },
});
