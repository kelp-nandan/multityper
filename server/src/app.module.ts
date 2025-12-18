import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthsModule } from './auths/auths.module';
import { UsersModule } from './users/users.module';
import configuration from './config/configuration';
import { databaseProviders } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    UsersModule,
    AuthsModule,
  ],
  controllers: [AppController],
  providers: [...databaseProviders],
})
export class AppModule { }
