import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';
@Injectable()
export class RedisService implements OnModuleInit {
  private client;
  private ready: Promise<void>;

  async onModuleInit() {
    this.client = createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.ready = this.client.connect();
    await this.ready;
    console.log('Connected to Redis');
  }

  async setRoom(id: string, data: any) {
    await this.ready;
    await this.client.set(id, JSON.stringify(data));
  }

  async getRoom(id: string) {
    await this.ready;
    const data = await this.client.get(id);
    return data ? JSON.parse(data) : null;
  }

  async deleteRoom(id: string) {
    await this.ready;
    await this.client.del(id);
  }

  async getAllRooms() {
    await this.ready;

    const rooms: any[] = [];
    let cursor = '0'; 

    do {
      const reply = await this.client.scan(cursor, {
        MATCH: '*', 
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
        });
      }
    } while (cursor !== '0'); 

    return rooms;
  }


}
