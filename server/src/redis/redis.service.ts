import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { createClient, RedisClientType } from "redis";
import { IFetchRooms, IRoomData } from "src/interfaces/rooms.interface";

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: RedisClientType;

  async onModuleInit(): Promise<void> {
    this.redisClient = createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`,
    });

    this.redisClient.on("error", err => {
      this.logger.error("Redis Client Error:", err);
    });

    await this.redisClient.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.redisClient.quit();
  }

  async setRoom(room: IFetchRooms): Promise<void> {
    await this.redisClient.set(room.key, JSON.stringify(room.data));
  }

  async getRoom(id: string): Promise<IRoomData | null> {
    const data = await this.redisClient.get(id);
    return data ? (JSON.parse(data) as IRoomData) : null;
  }

  async deleteRoom(id: string): Promise<void> {
    await this.redisClient.del(id);
  }

  async getAllRooms(): Promise<IFetchRooms[]> {
    const rooms: IFetchRooms[] = [];
    let cursor = "0";

    do {
      const reply = await this.redisClient.scan(cursor, {
        MATCH: "*",
        COUNT: 100,
      });

      cursor = reply.cursor;
      const keys = reply.keys;

      if (keys.length > 0) {
        const values = await this.redisClient.mGet(keys);

        values.forEach((value, index) => {
          if (value) {
            const roomData = JSON.parse(value) as IRoomData;
            rooms.push({
              key: keys[index],
              data: roomData,
            });
          }
        });
      }
    } while (cursor !== "0");
    return rooms;
  }
}
