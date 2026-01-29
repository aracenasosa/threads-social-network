import { Document } from "mongoose";

/**
 * Post document interface extending Mongoose Document
 */
export interface IPost extends Document {
  author: string;
  text: string;
  parentPost?: string | null;
  likesCount: number;
  repliesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Uploaded media asset tracking (for rollback purposes)
 */
export interface UploadedAsset {
  publicId: string;
  resourceType: "image" | "video";
  url: string;
}

/**
 * Media item structure (simplified for API responses)
 */
export interface MediaItem {
  type: "image" | "video";
  publicId?: string;
  url?: string;
}

/**
 * Serialized author data for API responses
 */
export interface SerializedAuthor {
  _id: string;
  userName: string;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * Feed item structure for getFeed response
 */
export interface FeedItem {
  _id: string;
  text: string;
  author: SerializedAuthor;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  media: MediaItem[];
}

/**
 * Feed response structure
 */
export interface FeedResponse {
  items: FeedItem[];
  nextCursor: Date | null;
}

/**
 * Post node structure for thread tree
 */
export interface PostNode {
  _id: string;
  parentPost: string | null;
  text: string;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: SerializedAuthor;
  media: MediaItem[];
  replies: PostNode[];
}

/**
 * Parameters for building post thread tree
 */
export interface BuildTreeParams {
  root: any;
  descendants: any[];
  usersById: UsersByIdMap;
  mediaByPostId: MediaByPostMap;
  likedPostIds?: Set<string>;
  order: "asc" | "desc";
}

/**
 * Query parameters for getFeed endpoint
 */
export interface GetFeedQueryParams {
  limit?: number;
  order?: "asc" | "desc";
  cursor?: string;
  author?: string;
}

/**
 * Create post request body
 */
export interface CreatePostBody {
  author: string;
  text: string;
  parentPost?: string;
}

/**
 * Create post response
 */
export interface CreatePostResponse {
  post: IPost;
  media: MediaItem[];
}

/**
 * User data structure from thread aggregation
 */
export interface ThreadUserData {
  _id: string;
  fullName: string;
  userName: string;
  profilePhotoPublicId?: string;
  profilePhoto?: string;
}

/**
 * Map type for organizing media items by post ID
 */
export type MediaByPostMap = Map<string, MediaItem[]>;

/**
 * Map type for organizing users by their ID
 */
export type UsersByIdMap = Map<string, ThreadUserData>;
