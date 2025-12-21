import { Module } from "@nestjs/common";
import { RoomGateWay } from "./rooms.gateway";
import { RedisModule } from "src/redis/redis.module";
import { AuthModule } from "src/auth/auth.module";
import { WsJwtGuard } from "src/auth/guards/ws-jwt.guard";
import { DatabaseModule } from "src/database/database.module";

@Module({
  imports: [RedisModule, AuthModule, DatabaseModule],
  providers: [RoomGateWay, WsJwtGuard],
})
export class ChatModule {}
