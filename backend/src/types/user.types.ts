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
  profilePhotoPublicId?: string;
  comparePassword: (password: string) => Promise<boolean>;
}
