import { Request, Response } from "express";
import { Like } from "../models/like.model";
import { Post } from "../models/post.model";
import mongoose from "mongoose";

export const toggleLike = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { postId } = req.params;
    const userId = req.userId; // Authenticated user from middleware

    if (!userId || !postId) {
      return res
        .status(400)
        .json({ message: "User ID and Post ID are required" });
    }

    const existingLike = await Like.findOne({
      user: userId,
      post: postId,
    }).session(session);

    let liked = false;
    if (existingLike) {
      // 1️⃣ Unlike logic
      await Like.deleteOne({ _id: existingLike._id }).session(session);
      await Post.findByIdAndUpdate(postId, {
        $inc: { likesCount: -1 },
      }).session(session);
      liked = false;
    } else {
      // 2️⃣ Like logic
      await Like.create([{ user: userId, post: postId }], { session });
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }).session(
        session,
      );
      liked = true;
    }

    await session.commitTransaction();

    const updatedPost = await Post.findById(postId).select("likesCount");

    return res.status(200).json({
      message: liked ? "Post liked" : "Post unliked",
      liked,
      likesCount: updatedPost?.likesCount || 0,
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  } finally {
    session.endSession();
  }
};
