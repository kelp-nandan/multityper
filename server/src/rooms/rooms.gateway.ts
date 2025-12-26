import { Logger, UseGuards } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { v4 as uuid4 } from "uuid";

import { WsJwtGuard } from "../auth/guards/ws-jwt.guard";
import { wsConfig } from "../config/wsConfig";
import { MAX_PROGRESS, MIN_PROGRESS, REDIRECT_DELAY } from "../constants";
import { IPlayerStats } from "../interfaces";
import { IFetchRooms, IPlayer, IRoomData } from "../interfaces/rooms.interface";
import { ParagraphService } from "../paragraph/paragraph.service";
import { RedisService } from "../redis/redis.service";

@WebSocketGateway(wsConfig)
@UseGuards(WsJwtGuard)
export class RoomGateWay implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RoomGateWay.name);

  constructor(
    private redisService: RedisService,
    private paragraphService: ParagraphService,
  ) {}
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("create-room")
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() name: { roomName: string },
  ): Promise<void> {
    const roomId = uuid4();
    try {
      await this.redisService.setRoom({
        key: roomId,
        data: {
          roomName: name.roomName,
          players: [
            {
              userId: client.data.user.id,
              userName: client.data.user.name,
              isCreated: true,
            },
          ],
          gameStarted: false,
        },
      });
      const newRoom = await this.redisService.getRoom(roomId);
      await client.join(roomId);
      client.emit("room-created-by-me", {
        key: roomId,
        data: newRoom,
      });
      client.broadcast.emit("new-room-available", {
        key: roomId,
        data: newRoom,
      });
    } catch (err) {
      this.logger.error("Error creating room", err);
    }
  }

  @SubscribeMessage("leave-room")
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    try {
      const roomData = await this.redisService.getRoom(data.roomId);
      if (!roomData) {
        this.logger.error("Room not found");
        return;
      }

      const userId = client.data.user.id;

      const updatedplayers = roomData.players.filter((player: IPlayer) => {
        return player.userId !== userId;
      });

      roomData.players = updatedplayers;
      await this.redisService.setRoom({
        key: data.roomId,
        data: roomData,
      });

      await client.leave(data.roomId);
      client.emit("left-room-by-me");
      client.to(data.roomId).emit("room-updated", { key: data.roomId, data: roomData });
      this.server.emit("room-updated", roomData);
    } catch (err) {
      this.logger.error("Error leaving room", err);
    }
  }

  @SubscribeMessage("get-room")
  async handleGetRooms(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const roomData = await this.redisService.getRoom(data.roomId);
    if (!roomData) {
      client.emit("join-room-error", {
        message: "Room does not exist",
      });
      return;
    }
    if (!roomData.players.some((p: IPlayer) => p.userId === client.data.user.id)) {
      client.emit("join-room-error", { message: "Not authorized" });
      return;
    }
    await client.join(data.roomId);
    client.emit("joined-room", { key: data.roomId, data: roomData });
  }

  @SubscribeMessage("join-room")
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    try {
      const user = client.data.user;
      const roomData = await this.redisService.getRoom(data.roomId);
      if (!roomData) {
        client.emit("join-room-error", {
          message: "Room does not exist",
        });
        return;
      }
      if (roomData.players.length >= 5) {
        client.emit("join-room-error", {
          message: "Room is full. Maximum 5 players allowed",
        });
        return;
      }
      if (roomData.gameStarted) {
        client.emit("join-room-error", {
          message: "Game is already started in this room",
        });
        return;
      }
      const players = roomData.players || [];
      const existingIndex = players.findIndex((player: IPlayer) => {
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
      await this.redisService.setRoom({
        key: data.roomId,
        data: roomData,
      });
      await client.join(data.roomId);
      client.emit("joined-room", { key: data.roomId, data: roomData });
      client.to(data.roomId).emit("room-updated", { key: data.roomId, data: roomData });
    } catch (err) {
      this.logger.error("Error joining room", err);
      client.emit("join-room-error", { message: "Failed to join room" });
    }
  }

  @SubscribeMessage("destroy-room")
  async handleDestroyRoom(@MessageBody() data: { roomId: string }): Promise<void> {
    await this.redisService.deleteRoom(data.roomId);
    this.server.emit("room-destroyed", { roomId: data.roomId });
  }

  @SubscribeMessage("get-all-rooms")
  async handlegetAllrooms(@ConnectedSocket() client: Socket): Promise<void> {
    const data = await this.redisService.getAllRooms();
    client.emit("set-all-rooms", data);
  }

  @SubscribeMessage("countdown")
  async handleCountdown(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ): Promise<void> {
    const userId = client.data.user.id;
    const roomData = await this.redisService.getRoom(roomId);

    if (!roomData) {
      throw new WsException("Room not found");
    }

    const isCreator = roomData.players.some(
      (player: IPlayer) => player.userId === userId && player.isCreated === true,
    );

    if (!isCreator) {
      throw new WsException("Only room creator can start the game");
    }

    // Lock the room so no new players can join
    roomData.gameStarted = true;
    await this.redisService.setRoom({
      key: roomId,
      data: roomData,
    });

    // Emit lock-room event to all clients
    this.server.emit("lock-room", { key: roomId, data: roomData });

    // Emit game-started to room participants to navigate them
    this.server.to(roomId).emit("game-started", { key: roomId, data: roomData });

    // Start 10-second countdown
    setTimeout(async () => {
      try {
        // grab random paragraph
        const paragraph = await this.paragraphService.getRandomParagraph();

        // add paragraph to room
        const updatedRoomData = await this.redisService.getRoom(roomId);
        if (updatedRoomData) {
          // Emit paragraph to all players in the room
          this.server.to(roomId).emit("paragraph-ready", {
            roomId,
            paragraph: paragraph.content,
            paragraphId: paragraph.id,
          });
        }
      } catch (error) {
        this.logger.error("Error fetching paragraph", error);
        this.server.to(roomId).emit("game-error", {
          message: "Failed to load game content",
        });
      }
    }, 10000);
  }

  @SubscribeMessage("player-finished")
  async handlePlayerFinished(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; stats: IPlayerStats },
  ): Promise<void> {
    const userId = client.data.user.id;
    const roomData = await this.redisService.getRoom(data.roomId);

    if (!roomData) return;

    const playerIndex = roomData.players.findIndex((p: IPlayer) => p.userId === userId);
    if (playerIndex !== -1) {
      // set up stats if needed
      if (!roomData.players[playerIndex].stats) {
        roomData.players[playerIndex].stats = {};
      }

      // save player stats and mark done
      roomData.players[playerIndex].stats = {
        ...roomData.players[playerIndex].stats,
        ...data.stats,
        finished: true,
        progress: MAX_PROGRESS,
      };

      await this.redisService.setRoom({ key: data.roomId, data: roomData });

      // Broadcast this individual completion for the live progress bars
      this.server.to(data.roomId).emit("room-updated", { key: data.roomId, data: roomData });

      // see if everyone's done
      const allFinished = roomData.players.every((p: IPlayer) => p.stats?.finished === true);

      if (allFinished) {
        // All players finished - emit event and set up redirect
        this.server.to(data.roomId).emit("all-players-finished", {
          message: "All players have completed! Redirecting to leaderboard in 5 seconds...",
          roomId: data.roomId,
          players: roomData.players,
        });

        // Redirect after 5 seconds
        setTimeout(() => {
          this.server.to(data.roomId).emit("redirect-to-leaderboard", {
            roomId: data.roomId,
            finalResults: roomData.players,
          });
        }, REDIRECT_DELAY);
      } else {
        // Still waiting for other players
        const remainingPlayers = roomData.players.filter((p: IPlayer) => !p.stats?.finished).length;
        this.server.to(data.roomId).emit("player-finished", {
          completedUserId: userId,
          waitingCount: remainingPlayers,
        });
      }
    }
  }

  @SubscribeMessage("live-progress")
  async handleLiveProgress(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { progress: number; wpm?: number; accuracy?: number; roomId: string },
  ): Promise<void> {
    try {
      const userId = client.data.user.id;

      const roomData = await this.redisService.getRoom(data.roomId);
      if (!roomData) {
        throw new WsException("Room does not exist");
      }

      const playerIndex = roomData.players.findIndex((p: IPlayer) => p.userId === userId);

      if (playerIndex === -1) {
        throw new WsException("Not authorized for this room");
      }

      if (data.progress < MIN_PROGRESS || data.progress > MAX_PROGRESS) {
        throw new WsException(`Progress must be between ${MIN_PROGRESS} and ${MAX_PROGRESS}`);
      }

      if (!roomData.players[playerIndex].stats) {
        roomData.players[playerIndex].stats = {};
      }

      roomData.players[playerIndex].stats.progress = data.progress;
      if (data.wpm !== undefined) {
        roomData.players[playerIndex].stats.wpm = data.wpm;
      }
      if (data.accuracy !== undefined) {
        roomData.players[playerIndex].stats.accuracy = data.accuracy;
      }

      await this.redisService.setRoom({
        key: data.roomId,
        data: roomData,
      });

      this.server.to(data.roomId).emit("room-updated", {
        key: data.roomId,
        data: roomData,
      });
    } catch (error) {
      // Error handling can be added here if needed
    }
  }
}
