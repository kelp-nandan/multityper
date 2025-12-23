export interface IUser {
  id: number;
  name: string;
  email: string;
}

export interface IAuthResponse {
  message: string;
  data: {
    user: IUser;
    accessToken: string;
    refreshToken: string;
  };
}
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
}


export interface ILogoutResponse {
  message: string;
  success: boolean;
}

export interface IUsersListResponse {
  users: IUser[];
  total: number;
}
