import { Schema, model } from "mongoose";
import { POST_CONSTRAINTS } from "../constants/post.constants";

const postScheme = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    parentPost: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    rootPost: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    text: {
      type: String,
      required: false,
      trim: true,
      maxLength: [
        POST_CONSTRAINTS.MAX_TEXT_LENGTH,
        `Text must be at most ${POST_CONSTRAINTS.MAX_TEXT_LENGTH} characters long`,
      ],
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    repliesCount: {
      type: Number,
      default: 0,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
    threadIndex: {
      type: Number,
      default: null,
    },
    threadTotal: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true },
);

// indexes for feed + replies
postScheme.index({ createdAt: -1 });
postScheme.index({ parentPost: 1, createdAt: -1 }); // feed + replies ordering
postScheme.index({ author: 1, createdAt: -1 }); // profile posts

export const Post = model("Post", postScheme);
