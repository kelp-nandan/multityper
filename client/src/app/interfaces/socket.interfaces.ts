export interface IParagraphReady {
  roomId: string;
  paragraph: string;
  paragraphId: number;
}

export interface ICharacterState {
  char: string;
  state: CharState;
}

export interface IWordState {
  word: string;
  chars: ICharacterState[];
  state: WordState;
}

export type WordState = 'pending' | 'active' | 'completed';
export type CharState = 'pending' | 'correct' | 'incorrect';

export interface IGameCompletionData {
  message: string;
  roomId: string;
  players: IPlayerData[];
}

export interface ILeaderboardData {
  roomId: string;
  finalResults: IPlayerData[];
}

export interface IPlayerFinished {
  completedUserId: number;
  waitingCount: number;
}

export interface IPlayerStats {
  wpm?: number;
  accuracy?: number;
  totalMistakes?: number;
  timeTakenSeconds?: number;
  progress?: number;
  finished?: boolean;
}

export interface IPlayerData {
  userId: number;
  userName: string;
  isCreated: boolean;
  stats?: IPlayerStats;
}

export interface ILeaderboardPlayer {
  userId: number;
  userName: string;
  wpm: number;
  accuracy: number;
  totalMistakes: number;
  timeTakenSeconds: number;
  rank: number;
}

export interface ILeaderboardDisplay {
  username: string;
  wpm: number;
  accuracy: number;
  time: number;
  totalWrong: number;
}
