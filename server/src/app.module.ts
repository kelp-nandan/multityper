import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthsModule } from './auths/auths.module';
import { UsersModule } from './users/users.module';
import { RedisModule } from './redis/redis.module';
import configuration from './config/configuration';
import { ChatModule } from './rooms/rooms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('database.type') as 'postgres',
        url: configService.get<string>('database.url'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('nodeEnv') === 'development',
        logging: configService.get<string>('nodeEnv') === 'development',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthsModule,
    RedisModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
