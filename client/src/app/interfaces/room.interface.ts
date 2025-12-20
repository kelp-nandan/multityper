export interface Room{
  roomName: string,
  roomId: string,
  players: [
    {
      userId: number,
      userName: string,
      isCreated: boolean
    }
  ],
  isGameStarted: boolean
}