import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/user.model";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { userName, fullName, email, password } = req.body;

    if (!userName || !fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parsedEmail = email.toLowerCase();
    const parsedUsername = userName.toLowerCase();
    const userEmail = await User.findOne({ email: parsedEmail });
    const userUsername = await User.findOne({
      userName: parsedUsername,
    });

    if (userEmail) {
      return res
        .status(400)
        .json({ message: "An user with that email already exists" });
    }

    if (userUsername) {
      return res
        .status(400)
        .json({ message: "An user with that username already exists" });
    }

    const newUser = await User.create({
      userName: parsedUsername,
      fullName,
      email: parsedEmail,
      password,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        userName: newUser.userName,
        email: newUser.email,
      },
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};
