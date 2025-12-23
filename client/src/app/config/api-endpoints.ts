import { environment } from '../../environments/environment';

export const API_ENDPOINTS = {
  // Base API URL
  BASE_URL: environment.apiUrl,

  // Authentication endpoints
  AUTH: {
    LOGIN: `${environment.apiUrl}/auth/login`,
    REGISTER: `${environment.apiUrl}/auth/register`,
    LOGOUT: `${environment.apiUrl}/auth/logout`,
  },

  // Token management endpoints
  TOKEN: {
    REFRESH: `${environment.apiUrl}/token/refresh`,
  },

  // User management endpoints
  USERS: {
    PROFILE: `${environment.apiUrl}/users/profile`,
    LIST: `${environment.apiUrl}/users`,
  },

  // Paragraph endpoints
  PARAGRAPHS: {
    RANDOM: `${environment.apiUrl}/paragraphs/random`,
    BASE: `${environment.apiUrl}/paragraphs`,
  },
} as const;
