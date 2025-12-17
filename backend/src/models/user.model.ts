import { Schema, model } from "mongoose";
import { IUser } from "../types/user.types";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      minLength: [6, "Username must be at least 6 characters long"],
      maxLength: [20, "Username must be at most 20 characters long"],
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minLength: [6, "Full name must be at least 6 characters long"],
      maxLength: [100, "Full name must be at most 100 characters long"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: [6, "Password must be at least 6 characters long"],
      maxLength: [30, "Password must be at most 30 characters long"],
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>("User", userSchema);
