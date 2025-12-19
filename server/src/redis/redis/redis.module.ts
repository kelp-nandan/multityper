import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { RedisService } from './redis.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            inject: [ConfigService],
            useFactory: async (config : ConfigService) => {
                const client = createClient({
                    socket: {
                        host: config.get<string>('REDIS_HOST'),
                        port: config.get<number>('REDIS_PORT'),
                    },
                    password: config.get<string>('REDIS_PASSWORD'),
                    database: config.get<number>('REDIS_DB')
                });
                client.on('error', (err) => {
                    console.log(err.message);
                });
                await client.connect();
                console.log('Redis Connected Successfully');
                return client;
            },
        },
        RedisService
    ],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
