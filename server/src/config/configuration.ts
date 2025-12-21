import { ENV } from "./env.config";

export default () => ({
  port: ENV.PORT,
  nodeEnv: ENV.NODE_ENV,

  database: {
    type: ENV.DATABASE_TYPE,
    host: ENV.DATABASE_HOST,
    port: ENV.DATABASE_PORT,
    username: ENV.DATABASE_USER,
    password: ENV.DATABASE_PASSWORD,
    database: ENV.DB_NAME,
  },

  jwt: {
    secret: ENV.JWT_SECRET,
    expiresIn: ENV.JWT_EXPIRES_IN,
    refreshExpiresInDays: ENV.JWT_REFRESH_EXPIRES_DAYS,
  },

  cors: {
    origin: ENV.CORS_ORIGIN,
  },
});
