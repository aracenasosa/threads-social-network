import express from "express";
import {
  createUser,
  getUserById,
  getUsers,
  loginUser,
  logoutUser,
  removeUser,
  updateUser,
} from "../controllers/user.controller";
import {
  validateBody,
  validateRequiredFields,
} from "../middlewares/validateRequest.middleware";
import { uploadSingle } from "../middlewares/upload";
import { validateFormData } from "../middlewares/validateFormData";

const router = express.Router();

router.get("/", getUsers);

router.get("/:id", getUserById);

router.post(
  "/",
  uploadSingle.single("profilePhoto"),
  validateFormData({
    fields: ["userName", "fullName", "email", "password"],
    requireFiles: false,
  }),
  createUser
);

router.post(
  "/login",
  validateBody,
  validateRequiredFields(["userNameOrEmail", "password"]),
  loginUser
);

router.post(
  "/logout",
  validateBody,
  validateRequiredFields(["userNameOrEmail"]),
  logoutUser
);

router.delete("/delete/:id", removeUser);

router.patch("/update/:id", validateBody, updateUser);

export default router;
