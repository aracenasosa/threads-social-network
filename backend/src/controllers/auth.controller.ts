import { User } from "../models/user.model";
import { Request, Response } from "express";
import {
  REFRESH_TOKEN_SECRET,
  TokenPayload,
  signAccessToken,
  signRefreshToken,
} from "../utils/tokens";
import jwt from "jsonwebtoken";
import { googleClient } from "../utils/googleClient";

export const getRefreshCookieOptions = () => {
  // Use secure cookies only in production (when served over HTTPS)
  const isProd = process.env.NODE_ENV === "production"; // production must be HTTPS

  return {
    httpOnly: true as const,
    secure: isProd, // secure cookies only over HTTPS in production
    sameSite: "strict" as const, // adjust to "lax" or "none" if cross-domain frontend
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days; should align with refresh expiry
  };
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Validate email and username
    const parsedUsernameOrEmail = emailOrUsername.toLowerCase();

    const user = await User.findOne({
      $or: [
        { email: parsedUsernameOrEmail },
        { userName: parsedUsernameOrEmail },
      ],
    }).select("+password");

    // Check if user already exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password is correct
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const accessToken = signAccessToken({ userId: String(user._id) });
    const refreshToken = signRefreshToken({ userId: String(user._id) });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

    return res.status(200).json({
      message: "User logged in successfully",
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;

    if (token) {
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

    return res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Google code is required" });
    }

    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      return res
        .status(400)
        .json({ message: "Failed to get ID token from Google" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token payload" });
    }

    const { email, sub: googleId, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but doesn't have googleId, link it
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      // Generate unique username based on email or name
      let baseUsername = email.split("@")[0];
      // remove special chars
      baseUsername = baseUsername.replace(/[^a-zA-Z0-9]/g, "");

      let userName = baseUsername;
      let counter = 1;

      // Check for username collision
      while (await User.findOne({ userName })) {
        userName = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        email,
        fullName: name || baseUsername,
        userName,
        googleId,
        profilePhoto: picture,
      });
    }

    // Generate tokens
    const accessToken = signAccessToken({ userId: String(user._id) });
    const refreshToken = signRefreshToken({ userId: String(user._id) });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

    return res.status(200).json({
      message: "Google login successful",
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        avatarUrl: user.profilePhoto,
      },
    });
  } catch (error: any) {
    console.error("Google login error:", error);
    return res.status(500).json({ message: "Google login failed" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = (req.cookies?.refreshToken as string | undefined) || "";

  if (!refreshToken)
    return res.status(401).json({ message: "Missing refresh token" });

  // ... rest of refresh function is fine, just overwriting to insert googleAuth before it
  let payload;

  try {
    payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as TokenPayload;
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const userId = payload?.userId;

  const user = await User.findById(userId);
  if (!user || !user.refreshToken) {
    return res.status(401).json({ message: "Refresh not allowed" });
  }

  // Stored refresh token is hashed with bcrypt; compare hash with raw cookie token
  const isMatch = await user.compareRefreshToken(refreshToken);
  if (!isMatch) {
    return res.status(401).json({ message: "Refresh token mismatch" });
  }

  const newAccessToken = signAccessToken({ userId: String(user._id) });
  const newRefreshToken = signRefreshToken({ userId: String(user._id) });

  user.refreshToken = newRefreshToken;
  await user.save();

  res.cookie("refreshToken", newRefreshToken, getRefreshCookieOptions());

  return res.json({ accessToken: newAccessToken });
};
