import { Schema, model } from "mongoose";

const postScheme = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    parentPost: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      index: true,
      default: null,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      minLength: [3, "Text must be at least 3 characters long"],
      maxLength: [1000, "Text must be at most 1000 characters long"],
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// indexes for feed + replies
postScheme.index({ createdAt: -1 });
postScheme.index({ parentPost: 1, createdAt: -1 }); // feed + replies ordering
postScheme.index({ author: 1, createdAt: -1 }); // profile posts

export const Post = model("Post", postScheme);
