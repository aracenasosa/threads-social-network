import jwt, { SignOptions } from "jsonwebtoken";

export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "";
export const ACCESS_TOKEN_EXPIRE = process.env.ACCESS_TOKEN_EXPIRES || "";
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "";
export const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || "";
export type TokenPayload = { userId: string };
export const REFRESH_TOKEN_COOKIE_PATH = "/api/auth/refresh";

export const signAccessToken = (payload: TokenPayload) => {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is not defined");
  }

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRE || "15m",
  } as SignOptions);
};

export const signRefreshToken = (payload: TokenPayload) => {
  if (!REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET is not defined");
  }

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRE || "7d",
  } as SignOptions);
};
