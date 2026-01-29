// utils/cloudinaryUpload.ts
import cloudinary from "../config/cloudinary";

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: "image" | "video";
};

export function uploadBufferToCloudinary(params: {
  buffer: Buffer;
  folder: string;
  resourceType: "image" | "video";
}): Promise<CloudinaryUploadResult> {
  const { buffer, folder, resourceType } = params;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({
          secure_url: result.secure_url!,
          public_id: result.public_id!,
          resource_type: result.resource_type as "image" | "video",
        });
      },
    );

    stream.end(buffer);
  });
}

export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: "image" | "video",
) {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

type ImageVariant = "thumb" | "feed" | "full";

const IMAGE_PRESETS: Record<ImageVariant, any[]> = {
  thumb: [
    { width: 200, crop: "fill" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ],
  feed: [
    { width: 900, crop: "limit" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ],
  full: [
    { width: 1600, crop: "limit" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ],
};

export function buildMediaUrl(params: {
  type: "image" | "video";
  publicId: string;
  variant?: ImageVariant; // only applies to images
}) {
  const { type, publicId, variant = "feed" } = params;

  if (type === "image") {
    return cloudinary.url(publicId, {
      resource_type: "image",
      transformation: IMAGE_PRESETS[variant],
    });
  }

  // videos: return raw
  return cloudinary.url(publicId, { resource_type: "video" });
}

export function serializeMedia(
  mediaDocs: any[],
  variant: "thumb" | "feed" | "full" = "feed",
) {
  return mediaDocs.map((m) => ({
    type: m.type,
    url:
      m.type === "image"
        ? buildMediaUrl({ type: "image", publicId: m.publicId, variant })
        : buildMediaUrl({ type: "video", publicId: m.publicId }),
    // optional:
    // publicId: m.publicId
  }));
}
