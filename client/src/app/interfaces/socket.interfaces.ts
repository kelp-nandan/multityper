export interface IGameError {
    message: string;
}

export interface IParagraphReady {
    roomId: string;
    paragraph: string;
    paragraphId: number;
}

export interface IPlayerCompleted {
    userId: number;
    userName: string;
    stats: {
        wpm: number;
        accuracy: number;
        totalMistakes: number;
        timeTakenSeconds: number;
    };
}

export interface ISocketRoomData {
    key: string;
    data: {
        roomName: string;
        players: {
            userId: number;
            userName: string;
            isCreated: boolean;
        }[];
        isGameStarted: boolean;
    };
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