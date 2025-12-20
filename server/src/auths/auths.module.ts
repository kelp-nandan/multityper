import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        return {
          secret: configService.get<string>('jwt.secret'),
          signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') as any },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy],
  exports: [JwtModule],
})
export class AuthsModule {}
