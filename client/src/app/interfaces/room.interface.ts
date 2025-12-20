export interface IRoom{
  roomName: string,
  roomId: string,
  players: [
    {
      userId: number,
      userName: string,
      isCreated: boolean
    }
  ],
  gameStarted: boolean
}