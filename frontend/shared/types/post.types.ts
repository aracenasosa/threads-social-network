/**
 * Post related types and interfaces
 */

export interface PostAuthor {
  _id: string;
  userName: string;
  fullName: string;
  avatarUrl: string;
}

export interface PostMedia {
  type: "image" | "video";
  url: string;
}

export interface Post {
  _id: string;
  text: string;
  author: PostAuthor;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
  media: PostMedia[];
  parentPost?: string | null;
  replies?: Post[];
  isLiked?: boolean;
  isEdited?: boolean;
}

export interface FeedResponse {
  items: Post[];
  nextCursor?: string;
}

export interface CreatePostResponse {
  post: Post;
  media: PostMedia[];
}
