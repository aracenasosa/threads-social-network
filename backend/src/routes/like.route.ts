import { Router } from "express";
import { toggleLike } from "../controllers/like.controller";
import {
  validateBody,
  validateRequiredFields,
} from "../middlewares/validateRequest.middleware";
import { authenticateMiddleware } from "../middlewares/auth.middleware";

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: Like management endpoints
 */

const router = Router();

/**
 * @swagger
 * /api/likes/{postId}/toggle:
 *   post:
 *     summary: Toggle like on a post
 *     tags: [Likes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *       404:
 *         description: Post not found
 */
router.post(
  "/:postId/toggle",
  authenticateMiddleware,
  validateBody,
  toggleLike,
);

export default router;
