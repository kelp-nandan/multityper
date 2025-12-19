import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatGateWay } from './chat.gateway';
import { RedisModule } from 'src/redis/redis/redis.module';
@Module({
    providers: [JwtService, ChatGateWay],
    imports: [RedisModule]
})
export class ChatModule {}
