import { Injectable, OnModuleInit } from "@nestjs/common";
import { createClient, RedisClientType } from "redis";
import { IGetRooms } from "src/interfaces/rooms.interface";
@Injectable()
export class RedisService implements OnModuleInit {
  private client: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`,
    });

    await this.client.connect();

    this.client.on("error", err => console.error("Redis Client Error", err));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async setRoom(id: string, data: IGetRooms) {
    await this.client.set(data.roomId, JSON.stringify(data.data));
  }

  async getRoom(id: string) {
    const data = await this.client.get(id);
    return data ? JSON.parse(data) : null;
  }

  async deleteRoom(id: string) {
    await this.client.del(id);
  }

  async getAllRooms() {
    const rooms: IGetRooms[] = [];
    let cursor = "0";

    do {
      const reply = await this.client.scan(cursor, {
        MATCH: "*",
        COUNT: 100,
      });

      cursor = reply.cursor;
      const keys = reply.keys;

      if (keys.length > 0) {
        const values = await this.client.mGet(keys);

        values.forEach((value, index) => {
          if (value) {
            rooms.push({
              key: keys[index],
              data: JSON.parse(value),
            });
          }
          console.log("keys[index]: ", keys[index]);
        });
      }
    } while (cursor !== "0");
    return rooms;
  }
}
