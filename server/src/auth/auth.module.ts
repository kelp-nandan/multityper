import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { TokenController } from "./token.controller";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>("jwt.secret"),
          signOptions: {
            expiresIn: "15m",
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, TokenController],
  providers: [JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
