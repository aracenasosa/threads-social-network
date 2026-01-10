import { Document } from "mongoose";

/**
 * Media document interface extending Mongoose Document
 */
export interface IMedia extends Document {
  post: string;
  type: "image" | "video";
  url: string;
  publicId: string;
  createdAt: Date;
}

/**
 * Upload result from Cloudinary
 */
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: "image" | "video";
}

/**
 * Media upload parameters
 */
export interface MediaUploadParams {
  type: "image" | "video";
  url: string;
  publicId: string;
}
