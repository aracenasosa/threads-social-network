import { buildMediaUrl } from "./cloudinaryUpload";

export function serializeAuthor(u: any, id?: string) {
  if (!u) {
    throw new Error(
      `user with id: ${id || "unknown"} doesnt found in getPostFeed method`
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
          variant: "thumb",
        })
      : u.profilePhoto || "",
  };
}
