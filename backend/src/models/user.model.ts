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

    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    refreshToken: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  // Validate password length BEFORE hashing
  if (this.password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }
  if (this.password.length > 30) {
    throw new Error("Password must be at most 30 characters long");
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.pre("save", async function () {
  if (!this.isModified("refreshToken")) return;
  this.refreshToken = await bcrypt.hash(this.refreshToken, 10);
});

userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

export const User = model<IUser>("User", userSchema);
