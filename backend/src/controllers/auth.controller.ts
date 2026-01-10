import { User } from "../models/user.model";
import { Request, Response } from "express";
import { signAccessToken, signRefreshToken } from "../utils/tokens";

export const getRefreshCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "development"; // production must be HTTPS

  return {
    httpOnly: true as const,
    secure: isProd, // production must be HTTPS
    sameSite: "strict" as const, // adjust to "lax" or "none" if cross-domain frontend
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days; should align with refresh expiry
  };
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { userNameOrEmail, password } = req.body;

    // Validate email and username
    const parsedUsernameOrEmail = userNameOrEmail.toLowerCase();

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

    const accessToken = signAccessToken(String(user._id));
    const refreshToken = signRefreshToken(String(user._id));

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
    const { userNameOrEmail } = req.body;

    // Validate email and username
    const parsedUsernameOrEmail = userNameOrEmail.toLowerCase();

    const user = await User.findOne({
      $or: [
        { email: parsedUsernameOrEmail },
        { userName: parsedUsernameOrEmail },
      ],
    });

    // Check if user already exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};
