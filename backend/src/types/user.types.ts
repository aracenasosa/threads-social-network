import { Document } from "mongoose";

export interface IUser extends Document {
  userName: string;
  fullName: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  profilePhoto?: string;
  location?: string;
  bio?: string;
  profilePhotoPublicId?: string;
  refreshToken?: string | null;
  comparePassword: (password: string) => Promise<boolean>;
  compareRefreshToken: (refreshToken: string) => Promise<boolean>;
}
