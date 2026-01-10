import { Document } from "mongoose";

/**
 * Like document interface extending Mongoose Document
 */
export interface ILike extends Document {
  user: string;
  post: string;
  createdAt: Date;
}

/**
 * Toggle like request body
 */
export interface ToggleLikeBody {
  userId: string;
}

/**
 * Toggle like request params
 */
export interface ToggleLikeParams {
  postId: string;
}

/**
 * Toggle like response
 */
export interface ToggleLikeResponse {
  message: string;
  liked: boolean;
  likesCount: number;
}
