export interface IJwtPayload {
  sub: number;
  userId: number;
  name: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface IRefreshTokenPayload {
  sub: number;
  userId: number;
  type: "refresh";
  iat?: number;
  exp?: number;
}
