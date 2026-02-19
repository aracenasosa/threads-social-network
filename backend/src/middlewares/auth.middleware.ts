import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET, TokenPayload } from "../utils/tokens";

export const authenticateMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;

    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
