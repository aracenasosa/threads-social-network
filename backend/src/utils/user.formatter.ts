import { IUser } from "../types/user.types";
import { buildMediaUrl } from "./cloudinaryUpload";

/**
 * User response format for API responses.
 * Consolidates duplicated formatting logic from user controller.
 */
export interface FormattedUser {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  avatarUrl: string;
  location: string;
  bio: string;
}

/**
 * Formats a user document for API response.
 * Single Responsibility: This function ONLY handles user formatting.
 *
 * @param user - The user document from MongoDB
 * @returns Formatted user object for API response
 */
export function formatUserResponse(user: IUser): FormattedUser {
  return {
    id: String(user._id),
    fullName: user.fullName,
    userName: user.userName,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    avatarUrl: user.profilePhotoPublicId
      ? buildMediaUrl({
          type: "image",
          publicId: user.profilePhotoPublicId,
          variant: "feed",
        })
      : user.profilePhoto || "",
    location: user.location || "",
    bio: user.bio || "",
  };
}

/**
 * Formats multiple users for API response.
 *
 * @param users - Array of user documents from MongoDB
 * @returns Array of formatted user objects
 */
export function formatUsersResponse(users: IUser[]): FormattedUser[] {
  return users.map(formatUserResponse);
}
