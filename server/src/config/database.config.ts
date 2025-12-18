import { Sequelize } from 'sequelize';
import { ENV } from './env.config';

// Provider for raw database queries
export const databaseProviders = [
    {
        provide: 'SEQUELIZE',
        useFactory: async () => {
            const sequelize = new Sequelize({
                dialect: 'postgres',
                host: ENV.DATABASE_HOST,
                port: ENV.DATABASE_PORT,
                username: ENV.DATABASE_USER,
                password: ENV.DATABASE_PASSWORD,
                database: ENV.DB_NAME,
                logging: false,
            });

            await sequelize.authenticate();
            return sequelize;
        },
    },
];