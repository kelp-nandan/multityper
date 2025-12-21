export interface IGetRooms {
  key: string;
  data: {
    roomName: string;
    players: [
      {
        userId: number;
        userName: string;
        isCreated: boolean;
      },
    ];
  };
}