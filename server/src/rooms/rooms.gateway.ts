import { UseGuards } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { WsJwtGuard } from "src/auth/guards/ws-jwt.guard";
import { wsConfig } from "src/config/wsConfig";
import { RedisService } from "src/redis/redis.service";
import { v4 as uuid4 } from "uuid";

@WebSocketGateway(wsConfig)
@UseGuards(WsJwtGuard)
export class RoomGateWay {
  constructor(private redisService: RedisService) {}
  @WebSocketServer()
  server: Server;

  @SubscribeMessage("create-room")
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomName: string },
  ) {
    const roomId = uuid4();
    try {
      await this.redisService.setRoom({
        roomId,
        data: {
          roomName: data.roomName,
          players: [
            {
              userId: client.data.user.id,
              userName: client.data.user.name,
              isCreated: true,
            },
          ],
          isGameStarted: false,
        },
      });
      const newRoom = await this.redisService.getRoom(roomId);
      this.server.emit("created-room", {
        key: roomId,
        data: newRoom,
      });
    } catch (err) {
      console.log(err);
    }
  }

  @SubscribeMessage("join-room")
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    try {
      const user = client.data.user;
      const roomData = await this.redisService.getRoom(data.roomId);
      if (!roomData) return;
      const players = roomData.players || [];
      const existingIndex = players.findIndex(player => {
        return player.userId === user.id || player.userName === user.name;
      });
      if (existingIndex === -1) {
        players.push({
          userId: user.id,
          userName: user.name,
          isCreated: false,
        });
      } else {
        const existing = players[existingIndex];
        existing.userId = user.id;
        existing.userName = user.name;
        existing.isCreated = existing.isCreated || false;
        players[existingIndex] = existing;
      }

      roomData.players = players;
      await this.redisService.setRoom(data.roomId, roomData);
      this.server.emit("room-updated", { key: data.roomId, data: roomData });
    } catch (err) {
      console.error(err);
    }
  }

  @SubscribeMessage("destroy-room")
  async handleDestroyRoom(@MessageBody() data: { roomId: string }) {
    await this.redisService.deleteRoom(data.roomId);
    this.server.emit("room-destroyed", { roomId: data.roomId });
  }

  @SubscribeMessage("get-all-rooms")
  async handlegetAllrooms(@ConnectedSocket() client: Socket) {
    const data = await this.redisService.getAllRooms();
    client.emit("set-all-rooms", data);
  }

  @SubscribeMessage("countdown")
  async handleStartCountdown(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    const userId = client.data.user.id;
    const roomData = await this.redisService.getRoom(roomId);
    if (!roomData) return;
    const host = roomData.players.find(player => player.isCreated && player.userId === userId);

    if (!host) {
      throw new WsException("Only Host can start the game");
    }
    roomData.isGameStarted = true;
    this.server.to(roomId).emit("room-updated", roomData);
    setTimeout(async () => {
      await this.redisService.setRoom(roomId, roomData);
      this.server.to(roomId).emit("room-updated", roomData);
    }, 10000);
  }
}
