import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import {
  IUser,
  IAuthResponse,
  ILoginRequest,
  IRegisterRequest,
} from '../interfaces/auth.interfaces';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(private http: HttpClient) {}

  login(loginData: ILoginRequest): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(API_ENDPOINTS.AUTH.LOGIN, loginData);
  }

  register(registerData: IRegisterRequest): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(API_ENDPOINTS.AUTH.REGISTER, registerData);
  }

  getUserProfile(): Observable<IAuthResponse> {
    return this.http.get<IAuthResponse>(API_ENDPOINTS.USERS.PROFILE);
  }

  logout(): Observable<any> {
    return this.http.post(API_ENDPOINTS.AUTH.LOGOUT, {});
  }

  refreshToken(): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(API_ENDPOINTS.TOKEN.REFRESH, {});
  }

  getUsers(): Observable<any> {
    return this.http.get(API_ENDPOINTS.USERS.LIST);
  }
}
