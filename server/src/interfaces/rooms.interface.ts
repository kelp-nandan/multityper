export interface IPlayerStats {
  wpm?: number;
  accuracy?: number;
  totalMistakes?: number;
  timeTakenSeconds?: number;
  progress?: number;
  finished?: boolean;
}

export interface IPlayer {
  userId: number;
  userName: string;
  isCreated: boolean;
  stats?: IPlayerStats;
}

export interface IRoomData {
  roomName: string;
  players: IPlayer[];
  gameStarted: boolean;
}

export interface IFetchRooms {
  key: string;
  data: IRoomData;
}

export interface IPlayerStatsResponse {
  wpm: number;
  accuracy: number;
  totalMistakes: number;
  timeTakenSeconds: number;
}
