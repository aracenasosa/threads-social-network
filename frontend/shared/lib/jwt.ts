/**
 * Decode JWT token without verification (for client-side use)
 * We trust tokens from our own server, so we only need to decode, not verify
 *
 * Note: jsonwebtoken is a Node.js library and may not work in browser.
 * We use a manual decode as fallback for browser compatibility.
 */

import { decode } from "jsonwebtoken";
export interface TokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    // Try to use jsonwebtoken if available (works in Node.js/SSR)
    if (typeof window === "undefined") {
      // Server-side: use jsonwebtoken
      const decoded = decode(token);
      if (!decoded || typeof decoded === "string") {
        return null;
      }
      return decoded as TokenPayload;
    }

    // Browser-side: manual decode (jsonwebtoken doesn't work in browser)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return decoded as TokenPayload;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // Check if token is expired (with 10 seconds buffer)
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now + 10;
};
