export interface IPlayer {
  userId: number;
  userName: string;
  isCreated: boolean;
}

export interface IRoom {
  roomName: string;
  roomId: string;
  players: IPlayer[];
  gameStarted: boolean;
}