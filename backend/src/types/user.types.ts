import { Document } from "mongoose"; // TS refresh for showLocation

export interface IUser extends Document {
  userName: string;
  fullName: string;
  email: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
  profilePhoto?: string;
  location?: string;
  showLocation?: boolean;
  bio?: string;
  profilePhotoPublicId?: string;
  refreshToken?: string | null;
  googleId?: string;
  comparePassword: (password: string) => Promise<boolean>;
  compareRefreshToken: (refreshToken: string) => Promise<boolean>;
}

export interface FormattedUser {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  avatarUrl: string;
  location: string;
  showLocation: boolean;
  bio: string;
}
