import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { RedisService } from '../redis/redis.service';
import { ParagraphService } from '../paragraph/paragraph.service';
import { wsConfig } from '../config/wsConfig';
import { WsException } from '@nestjs/websockets';
import { v4 as uuid4 } from 'uuid';

interface IPlayerStats {
  wpm: number;
  accuracy: number;
  totalMistakes: number;
  timeTakenSeconds: number;
}

@WebSocketGateway(wsConfig)
@UseGuards(WsJwtGuard)
export class RoomGateWay {
  private readonly logger = new Logger(RoomGateWay.name);

  constructor(
    private redisService: RedisService,
    private paragraphService: ParagraphService
  ) { }
  @WebSocketServer()
  server: Server;

  @SubscribeMessage("create-room")
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomName: string },
  ) {
    const roomId = uuid4();
    try {
      await this.redisService.setRoom(roomId, {
        roomName: data.roomName,
        players: [
          {
            userId: client.data.user.id,
            userName: client.data.user.name,
            isCreated: true,
          },
        ],
        isGameStarted: false,
      });
      const newRoom = await this.redisService.getRoom(roomId);
      client.join(roomId);
      // Emit to creator only
      client.emit("room-created-by-me", {
        key: roomId,
        data: newRoom,
      });
      // Emit to all other clients (just for room list update)
      client.broadcast.emit("new-room-available", {
        key: roomId,
        data: newRoom,
      });
    } catch (err) {
      this.logger.error('Error creating room', err);
    }
  }

  @SubscribeMessage("join-room")
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    try {
      const user = client.data.user;
      const roomData = await this.redisService.getRoom(data.roomId);
      if (!roomData) {
        client.emit("join-room-error", { message: "Room not found" });
        return;
      }

      // Check if room is locked (game started or countdown started)
      if (roomData.isGameStarted) {
        client.emit("join-room-error", { message: "Cannot join room - game already started" });
        return;
      }

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
      client.join(data.roomId);
      client.emit("joined-room", { key: data.roomId, data: roomData });
      this.server.emit("room-updated", { key: data.roomId, data: roomData });
    } catch (err) {
      this.logger.error('Error joining room', err);
      client.emit("join-room-error", { message: "Failed to join room" });
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
  async handleCountdown(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    const userId = client.data.user.id;
    const roomData = await this.redisService.getRoom(roomId);

    if (!roomData) {
      throw new WsException("Room not found");
    }

    const isCreator = roomData.players.some(
      player => player.userId === userId && player.isCreated === true
    );

    if (!isCreator) {
      throw new WsException("Only room creator can start the game");
    }

    // Lock the room so no new players can join
    roomData.isGameStarted = true;
    await this.redisService.setRoom(roomId, roomData);

    // Emit lock-room event to all clients
    this.server.emit('lock-room', { key: roomId, data: roomData });

    // Emit game-started to room participants to navigate them
    this.server.to(roomId).emit("game-started", { key: roomId, data: roomData });

    // Start 10-second countdown
    setTimeout(async () => {
      try {
        // Get random paragraph after countdown
        const paragraph = await this.paragraphService.getRandomParagraph();

        // Update room data with paragraph
        const updatedRoomData = await this.redisService.getRoom(roomId);
        if (updatedRoomData) {
          // Emit paragraph to all players in the room
          this.server.to(roomId).emit("paragraph-ready", {
            roomId,
            paragraph: paragraph.content,
            paragraphId: paragraph.id
          });
        }
      } catch (error) {
        this.logger.error('Error fetching paragraph', error);
        this.server.to(roomId).emit("game-error", {
          message: "Failed to load game content"
        });
      }
    }, 10000);
  }


  @SubscribeMessage("player-finished")
  async handlePlayerFinished(@ConnectedSocket() client: Socket, @MessageBody() data: { stats: IPlayerStats }) {
    const userId = client.data.user.id;

    // Broadcast the completion to other players for real-time leaderboards
    // In the next step, we will store this in Redis to aggregate final results
    this.server.emit("player-completed-run", {
      userId,
      userName: client.data.user.name,
      stats: data.stats
    });
  }
}