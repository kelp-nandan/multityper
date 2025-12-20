import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ENV } from '../src/config/env.config';

const databaseConfig: { [key: string]: SequelizeModuleOptions } = {
    development: {
        dialect: 'postgres',
        host: ENV.DATABASE_HOST,
        port: ENV.DATABASE_PORT,
        username: ENV.DATABASE_USER,
        password: ENV.DATABASE_PASSWORD,
        database: ENV.DB_NAME,
        autoLoadModels: true,
        synchronize: false, // table creates in migration only
    },
};

export default databaseConfig;