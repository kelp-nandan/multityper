import { Module } from "@nestjs/common";
import { ChatGateWay } from "./rooms.gateway";
import { RedisModule } from "src/redis/redis.module";
import { AuthModule } from "src/auth/auth.module";
import { WsJwtGuard } from "src/auth/guards/ws-jwt.guard";

@Module({
  imports: [RedisModule, AuthModule],
  providers: [ChatGateWay, WsJwtGuard],
})
export class ChatModule {}
