import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import configuration from "./config/configuration";
import { DatabaseModule } from "./database/database.module";
import { ParagraphModule } from "./paragraph/paragraph.module";
import { RedisModule } from "./redis/redis.module";
import { RoomsModule } from "./rooms/rooms.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    RoomsModule,
    RedisModule,
    ParagraphModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
