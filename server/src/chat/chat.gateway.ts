import { UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from 'src/auths/guards/ws-jwt.guard';
import { RedisService } from 'src/redis/redis/redis.service';
import { v4 as uuid4 } from 'uuid'

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:4200',
        credentials: true
    }
})
@UseGuards(WsJwtGuard)
export class ChatGateWay {
    constructor(private redisService : RedisService) {}
    @WebSocketServer()
    server: Server;
    @SubscribeMessage('testing')
    handleTesting(@MessageBody() data: { msg: string }, @ConnectedSocket() client: Socket) {
        console.log(`received ${data.msg} from the client: ${client.id}`);
        client.emit('test', { msg: 'Hello from backend' });
    }

    @SubscribeMessage('create-room')
    async handleCreateRoom(@ConnectedSocket() client: Socket, @MessageBody() data: {roomName: string} ) {
        const roomId = uuid4();
        try{
            await this.redisService.setRoom(roomId, {
                roomName: data.roomName,
                players: [
                    { userId: client.data.user.id, userName: client.data.user.name, isCreated: true }
                ]
            });
            const newRoom = await this.redisService.getRoom(roomId);
            this.server.emit('created-room', {
                key: roomId,
                data: newRoom
            });
        } catch (err) {
            console.log(err);
        }
    }

    @SubscribeMessage('join-room')
    async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
      try{
        const user = client.data.user;
        console.log("roomId from the room", data.roomId);
        const roomData = await this.redisService.getRoom(data.roomId);
        if (!roomData) return;
                const players = roomData.players || [];

                const existingIndex = players.findIndex((player) => {
                    return (player.userId !== undefined && player.userId === user.id) ||
                                 (player.userName && player.userName === user.name);
                });

                if (existingIndex === -1) {
                    players.push({
                        userId: user.id,
                        userName: user.name,
                        isCreated: false
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
                this.server.emit('room-updated', { key: data.roomId, data: roomData });
        } catch (err) {
            console.error(err);
        }
    }

    @SubscribeMessage('destroy-room')
    async handleDestroyRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string}) {
        await this.redisService.deleteRoom(data.roomId);
        this.server.emit('room-destroyed', { roomId: data.roomId });
    }

    @SubscribeMessage('get-all-rooms')
    async handlegetAllrooms(@ConnectedSocket() client: Socket) {
        const data = await this.redisService.getAllRooms();
        client.emit('set-all-rooms', data);
    }
}