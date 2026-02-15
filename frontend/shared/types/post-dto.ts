/**
 * Post Data Transfer Objects (DTOs) for API requests
 */

/**
 * DTO for creating a new post
 */
export interface CreatePostDTO {
  author: string; // User ID
  text: string;
  parentPost?: string; // Post ID (for replies, optional for new posts)
  media?: File[]; // Array of files (images/videos), max 4 files, max 50MB total
}

/**
 * DTO for creating a post form data
 * Used when sending multipart/form-data to the API
 */
export interface CreatePostFormData {
  author: string;
  text: string;
  parentPost?: string;
  media?: File[];
}

/**
 * Validation constraints for post creation
 */
export const POST_CONSTRAINTS = {
  MAX_FILES: 20,
  MAX_TOTAL_SIZE_MB: 50,
  MAX_TOTAL_SIZE_BYTES: 50 * 1024 * 1024, // 50MB in bytes
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/webm", "video/quicktime"],
  MAX_TEXT_LENGTH: 500,
  MIN_TEXT_LENGTH: 1,
} as const;
