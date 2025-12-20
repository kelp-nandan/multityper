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

export interface IRooms {
  roomName: string;
  players: [
    {
      userId: number;
      userName: string;
      isCreated: boolean;
    },
  ];
  isGameStarted: boolean;
}
