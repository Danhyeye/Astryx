import type { ApiResponse } from "./api-response";

export type User = {
  id: string;
  email?: string;
  username: string;
  avatar: string | null;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt?: string;
};

export type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

export type RegisterData = {
  user: {
    id: string;
    email: string;
    username: string;
  };
};

export type RegisterResponse = ApiResponse<RegisterData>;

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginData = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = ApiResponse<LoginData>;

export type RefreshTokenInput = {
  refreshToken: string;
};

export type RefreshTokenData = {
  accessToken: string;
  refreshToken?: string;
};

export type RefreshTokenResponse = ApiResponse<RefreshTokenData>;

export type SessionData = {
  user: User;
};

export type SessionResponse = ApiResponse<SessionData>;
