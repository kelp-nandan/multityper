import * as dotenv from 'dotenv';

dotenv.config();

export const ENV = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),

    DATABASE_TYPE: process.env.DATABASE_TYPE || 'postgres',
    DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
    DATABASE_PORT: parseInt(process.env.DATABASE_PORT || '5432', 10),
    DATABASE_USER: process.env.DATABASE_USER || 'admin',
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || 'admin123',
    DB_NAME: process.env.DB_NAME || 'testdb',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://admin:admin123@localhost:5432/testdb',

    JWT_SECRET: process.env.JWT_SECRET || 'default-secret-key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_DAYS: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10),

    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4200',

    // Helper methods
    isProduction: (): boolean => process.env.NODE_ENV === 'production',
    isDevelopment: (): boolean => process.env.NODE_ENV !== 'production',
} as const;
