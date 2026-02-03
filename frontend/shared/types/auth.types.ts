/**
 * Authentication related types
 */

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  followers?: number;
  following?: number;
  createdAt: string;
}

export interface LoginUser {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  avatarUrl?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  avatarUrl?: string;
  location?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user?: LoginUser;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
