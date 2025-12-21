// models/Like.ts
import { Schema, model } from "mongoose";

const LikeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// prevent duplicate likes
LikeSchema.index({ user: 1, post: 1 }, { unique: true });

export const Like = model("Like", LikeSchema);
