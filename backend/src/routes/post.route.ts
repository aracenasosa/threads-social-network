import { Router } from "express";
import {
  createPost,
  getFeed,
  getPostThread,
  getLikedPosts,
} from "../controllers/post.controller";
import {
  uploadPostMedia,
  validateTotalUploadSizeMb,
} from "../middlewares/upload";
import { validateFormData } from "../middlewares/validateFormData";
import { authenticateMiddleware } from "../middlewares/auth.middleware";

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management endpoints
 */

const route = Router();

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - author
 *               - text
 *             properties:
 *               author:
 *                 type: string
 *                 description: Author ID
 *               text:
 *                 type: string
 *                 description: Post content
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: |
 *                   Upload photos and/or videos. Limits:
 *                   - Photos: max 5 files, each max 5MB
 *                   - Videos: max 2 files, each max 20MB
 *                   - Total size (all files): max 40MB
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input or file limits exceeded
 */
route.post(
  "/",
  authenticateMiddleware,
  uploadPostMedia,
  validateTotalUploadSizeMb(40),
  validateFormData({ fields: ["author"], requireFiles: false }),
  createPost,
);

/**
 * @swagger
 * /api/posts/feed:
 *   get:
 *     summary: Get user feed
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *       401:
 *         description: Unauthorized
 */
route.get("/feed", authenticateMiddleware, getFeed);
/**
 * @swagger
 * /api/posts/{id}/thread:
 *   get:
 *     summary: Get post thread
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Thread retrieved successfully
 *       404:
 *         description: Post not found
 */
route.get("/:id/thread", authenticateMiddleware, getPostThread);
/**
 * @swagger
 * /api/posts/liked:
 *   get:
 *     summary: Get posts liked by the user
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Liked posts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
route.get("/liked", authenticateMiddleware, getLikedPosts);

export default route;
