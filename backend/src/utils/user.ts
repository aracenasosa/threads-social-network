import { FormattedUser, IUser } from "../types/user.types";
import { buildMediaUrl } from "./cloudinaryUpload";

export function serializeAuthor(u: any, id?: string) {
  if (!u) {
    throw new Error(
      `user with id: ${id || "unknown"} doesnt found in getPostFeed method`,
    );
  }
  return {
    _id: String(u._id),
    userName: u.userName,
    fullName: u.fullName,
    avatarUrl: u.profilePhotoPublicId
      ? buildMediaUrl({
          type: "image",
          publicId: u.profilePhotoPublicId,
          variant: "avatar",
        })
      : u.profilePhoto || "",
  };
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
          variant: "avatar",
        })
      : user.profilePhoto || "",
    location: user.location || "",
    showLocation: user.showLocation ?? true,
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
