import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatGateWay } from './rooms.gateway';
import { RedisModule } from 'src/redis/redis.module';
@Module({
  providers: [JwtService, ChatGateWay],
  imports: [RedisModule],
})
export class ChatModule {}
