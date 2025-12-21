import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RedisModule } from "./redis/redis.module";
import configuration from "./config/configuration";
import { ChatModule } from "./rooms/rooms.module";
import { DatabaseModule } from "./database/database.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      load: [configuration],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    RedisModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
