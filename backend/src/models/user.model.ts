import { Schema, model } from "mongoose";
import { IUser } from "../types/user.types";
import bcrypt from "bcrypt";

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
        validator: function (v: string) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props: any) => `${props.value} is not a valid email!`,
      },
    },

    profilePhoto: {
      type: String,
      trim: true,
      default: "",
    },
    profilePhotoPublicId: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxLength: [160, "Bio must be at most 160 characters long"],
      default: "",
    },

    password: {
      type: String,
      required: false, // Make password optional for Google users
      trim: true,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
      default: "",
    },
    refreshToken: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  // If password is modified AND it exists
  if (this.isModified("password") && this.password) {
    // Validate password length BEFORE hashing
    if (this.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }
    if (this.password.length > 30) {
      throw new Error("Password must be at most 30 characters long");
    }

    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.pre("save", async function () {
  if (!this.isModified("refreshToken")) return;
  if (this.refreshToken) {
    this.refreshToken = await bcrypt.hash(this.refreshToken, 10);
  }
});

userSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

// Also update compareRefreshToken to be safe
userSchema.methods.compareRefreshToken = async function (
  refreshToken: string,
): Promise<boolean> {
  if (!this.refreshToken) return false;
  return await bcrypt.compare(refreshToken, this.refreshToken);
};

export const User = model<IUser>("User", userSchema);
