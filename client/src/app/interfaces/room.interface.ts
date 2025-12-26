import { IPlayerData } from './socket.interfaces';

export interface IRoom {
  key: string;
  data: {
    roomName: string;
    players: IPlayerData[];
    gameStarted: boolean;
  };
}
