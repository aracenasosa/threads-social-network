import { Request, Response } from "express";
import { IUser } from "../types/user.types";
import { User } from "../models/user.model";
import {
  deleteCloudinaryAsset,
  uploadBufferToCloudinary,
} from "../utils/cloudinaryUpload";
import {
  formatUserResponse,
  formatUsersResponse,
} from "../utils/user.formatter";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    return res.status(200).json(formatUsersResponse(users));
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: formatUserResponse(user) });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ userName: username.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: formatUserResponse(user) });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      $or: [
        { userName: { $regex: q, $options: "i" } },
        { fullName: { $regex: q, $options: "i" } },
      ],
    }).limit(20);

    return res.status(200).json({ users: formatUsersResponse(users) });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

export const createUser = async (req: Request, res: Response) => {
  let profilePhotoPublicId = "";

  try {
    const { userName, fullName, email, password, location, bio } = req.body;

    const parsedEmail = String(email).toLowerCase();
    const parsedUsername = String(userName).toLowerCase();

    const user = await User.findOne({
      $or: [{ email: parsedEmail }, { userName: parsedUsername }],
    });

    if (user) {
      return res.status(400).json({
        message: "An user with that email or username already exists",
      });
    }

    // ✅ Optional avatar upload
    let profilePhoto = "";

    if (req.file) {
      const result = await uploadBufferToCloudinary({
        buffer: req.file.buffer,
        folder: "social-network/avatars",
        resourceType: "image",
      });

      profilePhoto = result.secure_url;
      profilePhotoPublicId = result.public_id;
    }

    const newUser = await User.create({
      userName: parsedUsername,
      fullName,
      email: parsedEmail,
      password,
      location,
      bio,
      profilePhoto,
      profilePhotoPublicId,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: formatUserResponse(newUser),
    });
  } catch (error: any) {
    // rollback avatar upload if user creation fails
    if (profilePhotoPublicId) {
      await deleteCloudinaryAsset(profilePhotoPublicId, "image").catch(
        () => null,
      );
    }

    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

export const removeUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  let newProfilePhotoPublicId = "";

  try {
    const { id } = req.params;
    const { userName, fullName, email, password, location, bio } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Check for unique username/email if they are being changed
    if (userName || email) {
      const parsedUsername = userName?.toLowerCase();
      const parsedEmail = email?.toLowerCase();

      const existingUser = await User.findOne({
        _id: { $ne: id },
        $or: [
          ...(parsedUsername ? [{ userName: parsedUsername }] : []),
          ...(parsedEmail ? [{ email: parsedEmail }] : []),
        ],
      });

      if (existingUser) {
        return res.status(400).json({
          message: "A user with that email or username already exists",
        });
      }

      if (parsedUsername) user.userName = parsedUsername;
      if (parsedEmail) user.email = parsedEmail;
    }

    // ✅ Update other fields
    if (fullName) user.fullName = fullName;
    if (location) user.location = location;
    if (bio !== undefined) user.bio = bio;
    if (password) user.password = password;

    // ✅ Handle avatar update
    if (req.file) {
      const result = await uploadBufferToCloudinary({
        buffer: req.file.buffer,
        folder: "social-network/avatars",
        resourceType: "image",
      });

      const oldPublicId = user.profilePhotoPublicId;

      user.profilePhoto = result.secure_url;
      user.profilePhotoPublicId = result.public_id;
      newProfilePhotoPublicId = result.public_id;

      // ✅ Destroy the previous image from Cloudinary
      if (oldPublicId) {
        await deleteCloudinaryAsset(oldPublicId, "image").catch((err) =>
          console.error(`Failed to delete old asset ${oldPublicId}:`, err),
        );
      }
    }

    // ✅ Save the user (triggers .pre('save') hooks)
    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: formatUserResponse(user),
    });
  } catch (error: any) {
    // Rollback new upload if save fails
    if (newProfilePhotoPublicId) {
      await deleteCloudinaryAsset(newProfilePhotoPublicId, "image").catch(
        () => null,
      );
    }

    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};
