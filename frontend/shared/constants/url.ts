/**
 * API Base URL
 * Note: This already includes /api prefix
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * Authentication endpoints
 */
export const AUTH_LOGIN_ENDPOINT = "/auth/login";
export const AUTH_REGISTER_ENDPOINT = "/auth/register";
export const AUTH_LOGOUT_ENDPOINT = "/auth/logout";
export const AUTH_REFRESH_ENDPOINT = "/auth/refresh";

/**
 * User endpoints
 */
export const USER_BY_ID_ENDPOINT = (userId: string) => `/users/${userId}`;
export const USER_BY_USERNAME_ENDPOINT = (username: string) =>
  `/users/username/${username}`;

/**
 * Post endpoints
 */
export const POST_CREATE_ENDPOINT = "/posts";
export const POST_FEED_ENDPOINT = "/posts/feed";
export const POST_LIKED_ENDPOINT = "/posts/liked";
export const POST_THREAD_ENDPOINT = (postId: string) =>
  `/posts/${postId}/thread`;
