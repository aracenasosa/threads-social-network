import { Request, Response } from "express";
import { Post } from "../models/post.model";
import { Media } from "../models/media.model";
import {
  deleteCloudinaryAsset,
  serializeMedia,
  uploadBufferToCloudinary,
} from "../utils/cloudinaryUpload";
import mongoose from "mongoose";
import { buildTree, idStr } from "../utils/post";
import { serializeAuthor } from "../utils/user";

export const createPost = async (req: Request, res: Response) => {
  const { author, text, parentPost } = req.body;

  const files = (req.files as Express.Multer.File[]) || [];

  // Keep track of uploaded assets for rollback
  const uploaded: {
    publicId: string;
    resourceType: "image" | "video";
    url: string;
  }[] = [];

  try {
    // 1️⃣ Create post
    const post = await Post.create({
      author,
      text,
      parentPost: parentPost || null,
    });

    // 2️⃣ If this is a reply → increment parent repliesCount
    if (parentPost) {
      await Post.updateOne({ _id: parentPost }, { $inc: { repliesCount: 1 } });
    }

    // 3️⃣ Upload all media (if any)
    if (files.length > 0) {
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          const resourceType: "image" | "video" = file.mimetype.startsWith(
            "video/"
          )
            ? "video"
            : "image";

          const result = await uploadBufferToCloudinary({
            buffer: file.buffer,
            folder: "social-network/posts",
            resourceType,
          });

          uploaded.push({
            publicId: result.public_id,
            resourceType: result.resource_type,
            url: result.secure_url,
          });

          return {
            type: resourceType,
            url: result.secure_url,
            publicId: result.public_id,
          };
        })
      );

      // 4️⃣ Save Media docs (one per file)
      await Media.insertMany(
        uploadResults.map((m) => ({
          post: post._id,
          type: m.type,
          url: m.url,
          publicId: m.publicId,
        }))
      );
    }

    // 5️⃣ Return post (and optionally media list)
    const media = await Media.find({ post: post._id }).select("type url -_id");
    return res.status(201).json({ post, media });
  } catch (err) {
    // Rollback uploaded assets if something fails mid-way
    await Promise.all(
      uploaded.map((u) =>
        deleteCloudinaryAsset(u.publicId, u.resourceType).catch(() => null)
      )
    );

    console.error(err);
    return res.status(500).json({ message: "Failed to create post" });
  }
};

export const getFeed = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    const order = String(req.query.order ?? "desc") === "asc" ? 1 : -1;
    const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : null;
    const author = req.query.author as string | undefined;

    const filter: any = { parentPost: null };
    if (author) filter.author = author;
    if (cursor && !Number.isNaN(cursor.getTime())) {
      filter.createdAt = order === -1 ? { $lt: cursor } : { $gt: cursor };
    }

    // 1) fetch posts (light)
    const posts = await Post.find(filter)
      .sort({ createdAt: order })
      .limit(limit)
      .select("_id author text likesCount repliesCount createdAt updatedAt")
      .populate(
        "author",
        "_id userName fullName profilePhotoPublicId profilePhoto"
      ); // ✅ include avatar fields

    const postIds = posts.map((p) => p._id);

    // 2) fetch media for these posts
    const mediaDocs = await Media.find({ post: { $in: postIds } })
      .select("post type publicId url -_id")
      .lean();

    const mediaByPostId = new Map<
      string,
      { type: "image" | "video"; publicId?: string; url?: string }[]
    >();

    for (const m of mediaDocs) {
      const pid = String(m.post);
      if (!mediaByPostId.has(pid)) mediaByPostId.set(pid, []);
      mediaByPostId.get(pid)!.push({
        type: m.type,
        publicId: m.publicId,
        url: m.url,
      });
    }

    const items = posts.map((p: any) => ({
      _id: p._id,
      text: p.text,
      author: serializeAuthor(
        p.author,
        String(p.populated("author") || p.author)
      ), // ✅ pass ID for error reporting
      likesCount: p.likesCount,
      repliesCount: p.repliesCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      media: serializeMedia(mediaByPostId.get(String(p._id)) ?? [], "feed"),
    }));

    const nextCursor = items.length ? items[items.length - 1].createdAt : null;

    return res.json({ items, nextCursor });
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ message: err.message || "Failed to load feed" });
  }
};

export const getPostThread = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const orderParam = String(req.query.order ?? "asc").toLowerCase();
    const order: "asc" | "desc" = orderParam === "desc" ? "desc" : "asc";

    const rows = await Post.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(postId) } },

      {
        $graphLookup: {
          from: "posts",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentPost",
          as: "descendants",
        },
      },

      {
        $addFields: {
          threadPostIds: { $concatArrays: [["$_id"], "$descendants._id"] },
        },
      },

      {
        $addFields: {
          threadAuthorIds: { $setUnion: [["$author"], "$descendants.author"] },
        },
      },

      // ✅ FIX: username -> userName, also include avatar fields
      {
        $lookup: {
          from: "users",
          let: { ids: "$threadAuthorIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
            {
              $project: {
                _id: 1,
                fullName: 1,
                userName: 1,
                profilePhotoPublicId: 1,
                profilePhoto: 1,
              },
            },
          ],
          as: "threadUsers",
        },
      },

      {
        $lookup: {
          from: "media",
          let: { postIds: "$threadPostIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$post", "$$postIds"] } } },
            { $project: { _id: 0, post: 1, type: 1, url: 1, publicId: 1 } },
          ],
          as: "threadMedia",
        },
      },

      {
        $project: {
          _id: 1,
          author: 1,
          parentPost: 1,
          text: 1,
          likesCount: 1,
          repliesCount: 1,
          createdAt: 1,
          updatedAt: 1,
          descendants: 1,
          threadUsers: 1,
          threadMedia: 1,
        },
      },
    ]);

    if (!rows.length) {
      return res.status(404).json({ message: "Post not found" });
    }

    const rootDoc = rows[0];

    const usersById = new Map<string, any>();
    for (const u of rootDoc.threadUsers ?? []) {
      usersById.set(idStr(u._id), u);
    }

    const mediaByPostId = new Map<string, any[]>();
    for (const m of rootDoc.threadMedia ?? []) {
      const pid = idStr(m.post);
      if (!mediaByPostId.has(pid)) mediaByPostId.set(pid, []);
      mediaByPostId.get(pid)!.push({
        type: m.type,
        publicId: m.publicId,
        url: m.url,
      });
    }

    // ✅ Root post needs serialized author/media too
    const thread = buildTree({
      root: rootDoc,
      descendants: rootDoc.descendants ?? [],
      usersById,
      mediaByPostId,
      order,
    });

    return res.json(thread);
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch thread" });
  }
};
