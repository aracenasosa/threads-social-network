import { Request, Response } from "express";
import { IUser } from "../types/user.types";
import { User } from "../models/user.model";
import {
  buildMediaUrl,
  deleteCloudinaryAsset,
  uploadBufferToCloudinary,
} from "../utils/cloudinaryUpload";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    const formatUsers = users.map((user: IUser) => ({
      id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      avatarUrl: user.profilePhotoPublicId
        ? buildMediaUrl({
            type: "image",
            publicId: user.profilePhotoPublicId,
            variant: "thumb",
          })
        : "",
    }));

    return res.status(200).json(formatUsers);
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

    return res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

export const createUser = async (req: Request, res: Response) => {
  let uploadedPublicId: string | null = null;

  try {
    const { userName, fullName, email, password, location } = req.body;

    const parsedEmail = String(email).toLowerCase();
    const parsedUsername = String(userName).toLowerCase();

    const userEmail = await User.findOne({ email: parsedEmail });
    if (userEmail) {
      return res
        .status(400)
        .json({ message: "An user with that email already exists" });
    }

    const userUsername = await User.findOne({ userName: parsedUsername });
    if (userUsername) {
      return res
        .status(400)
        .json({ message: "An user with that username already exists" });
    }

    // ✅ Optional avatar upload
    let profilePhoto = "";
    let profilePhotoPublicId = "";

    if (req.file) {
      const result = await uploadBufferToCloudinary({
        buffer: req.file.buffer,
        folder: "social-network/avatars",
        resourceType: "image",
      });

      uploadedPublicId = result.public_id;
      profilePhoto = result.secure_url;
      profilePhotoPublicId = result.public_id;
    }

    const newUser = await User.create({
      userName: parsedUsername,
      fullName,
      email: parsedEmail,
      password,
      location,
      profilePhoto,
      profilePhotoPublicId,
    });

    const avatarUrl = newUser.profilePhotoPublicId
      ? buildMediaUrl({
          type: "image",
          publicId: newUser.profilePhotoPublicId,
          variant: "thumb",
        })
      : "";

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        userName: newUser.userName,
        email: newUser.email,
        avatarUrl,
      },
    });
  } catch (error: any) {
    // rollback avatar upload if user creation fails
    if (uploadedPublicId) {
      await deleteCloudinaryAsset(uploadedPublicId, "image").catch(() => null);
    }

    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
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

    return res.status(200).json({
      message: "User logged in successfully",
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
  try {
    const { id } = req.params;

    const userUpdated = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!userUpdated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User updated succesfully",
      user: {
        id: userUpdated._id,
        fullName: userUpdated.fullName,
        userName: userUpdated.userName,
        email: userUpdated.email,
      },
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};
