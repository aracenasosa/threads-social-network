// models/Media.ts
import { Schema, model } from "mongoose";

const MediaSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { timestamps: true }
);

MediaSchema.index({ post: 1 });

export const Media = model("Media", MediaSchema);
