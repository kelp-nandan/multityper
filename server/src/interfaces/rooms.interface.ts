export interface GetRooms { 
  key: string, 
  data: {
    roomName: string,
    players: [
      {
        userId: number,
        userName: string,
        isCreated: boolean
      }
    ]
  }
}

export interface Rooms {
  roomName: string,
  players: [
    {
      userId: number,
      userName: string,
      isCreated: boolean
    }
  ],
  isGameStarted: boolean;
}